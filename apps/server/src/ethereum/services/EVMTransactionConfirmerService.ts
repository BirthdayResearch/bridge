import { fromAddress } from '@defichain/jellyfish-address';
import { BadRequestException, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EthereumTransactionStatus } from '@prisma/client';
import { EnvironmentNetwork } from '@waveshq/walletkit-core';
import BigNumber from 'bignumber.js';
import { BigNumber as EthBigNumber, Contract, ethers } from 'ethers';
import { BridgeV2__factory, ERC20__factory } from 'smartcontracts';

import { SupportedEVMTokenSymbols } from '../../AppConfig';
import { WhaleApiClientProvider } from '../../defichain/providers/WhaleApiClientProvider';
import { SendService } from '../../defichain/services/SendService';
import { ETHERS_RPC_PROVIDER } from '../../modules/EthersModule';
import { PrismaService } from '../../PrismaService';
import { getNextDayTimestamp } from '../../utils/DateUtils';
import { getDTokenDetailsByWToken } from '../../utils/TokensUtils';

@Injectable()
export class EVMTransactionConfirmerService {
  private contract: Contract;

  private network: EnvironmentNetwork;

  constructor(
    @Inject(ETHERS_RPC_PROVIDER) readonly ethersRpcProvider: ethers.providers.StaticJsonRpcProvider,
    private readonly clientProvider: WhaleApiClientProvider,
    private readonly sendService: SendService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.network = this.configService.getOrThrow<EnvironmentNetwork>(`defichain.network`);
    this.contract = new ethers.Contract(
      this.configService.getOrThrow('ethereum.contracts.bridgeProxy.address'),
      BridgeV2__factory.abi,
      this.ethersRpcProvider,
    );
  }

  async getBalance(tokenSymbol: SupportedEVMTokenSymbols): Promise<string> {
    const contractABI = ['function balanceOf(address) view returns (uint256)'];
    if (!SupportedEVMTokenSymbols[tokenSymbol]) {
      throw new BadRequestException(`Token: "${tokenSymbol}" is not supported`);
    }

    if (tokenSymbol === SupportedEVMTokenSymbols.ETH) {
      const balance = await this.ethersRpcProvider.getBalance(this.contract.address);
      return ethers.utils.formatEther(balance);
    }

    const tokenContract = new ethers.Contract(
      this.configService.getOrThrow(`ethereum.contracts.${SupportedEVMTokenSymbols[tokenSymbol]}.address`),
      contractABI,
      this.ethersRpcProvider,
    );
    const balance = await tokenContract.balanceOf(this.contract.address);
    return ethers.utils.formatUnits(balance, 6);
  }

  async handleTransaction(transactionHash: string): Promise<HandledEVMTransaction> {
    const txReceipt = await this.ethersRpcProvider.getTransactionReceipt(transactionHash);
    // if transaction is still pending
    if (txReceipt === null) {
      return { numberOfConfirmations: 0, isConfirmed: false };
    }
    // if transaction is reverted
    const isReverted = txReceipt.status === 0;
    if (isReverted === true) {
      throw new BadRequestException(`Transaction Reverted`);
    }

    const currentBlockNumber = await this.ethersRpcProvider.getBlockNumber();
    const numberOfConfirmations = currentBlockNumber - txReceipt.blockNumber;
    const txHashFound = await this.prisma.bridgeEventTransactions.findFirst({
      where: {
        transactionHash,
      },
    });
    if (txHashFound === null) {
      if (numberOfConfirmations < 65) {
        await this.prisma.bridgeEventTransactions.create({
          data: {
            transactionHash,
            status: EthereumTransactionStatus.NOT_CONFIRMED,
          },
        });
        return { numberOfConfirmations, isConfirmed: false };
      }
      await this.prisma.bridgeEventTransactions.create({
        data: {
          transactionHash,
          status: EthereumTransactionStatus.CONFIRMED,
        },
      });
      return { numberOfConfirmations, isConfirmed: true };
    }
    if (numberOfConfirmations < 65) {
      return { numberOfConfirmations, isConfirmed: false };
    }
    await this.prisma.bridgeEventTransactions.update({
      where: {
        id: txHashFound?.id,
      },
      data: {
        status: EthereumTransactionStatus.CONFIRMED,
      },
    });
    return { numberOfConfirmations, isConfirmed: true };
  }

  async signClaim({
    receiverAddress,
    tokenAddress,
    amount,
  }: SignClaim): Promise<{ signature: string; nonce: number; deadline: number }> {
    try {
      // Connect signer ETH wallet (admin/operational wallet)
      const wallet = new ethers.Wallet(
        this.configService.getOrThrow('ethereum.ethWalletPrivKey'),
        this.ethersRpcProvider,
      );

      const { chainId } = await this.ethersRpcProvider.getNetwork();
      const nonce = await this.contract.eoaAddressToNonce(receiverAddress);
      const domainName = await this.contract.name();
      const domainVersion = await this.contract.version();
      const deadline = getNextDayTimestamp();

      const domain = {
        name: domainName,
        chainId,
        verifyingContract: this.contract.address,
        version: domainVersion,
      };
      const types = {
        CLAIM: [
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
          { name: 'tokenAddress', type: 'address' },
        ],
      };
      const data = {
        to: receiverAddress,
        amount: ethers.utils.parseEther(amount),
        nonce,
        deadline,
        tokenAddress,
      };

      // eslint-disable-next-line no-underscore-dangle
      const signature = await wallet._signTypedData(domain, types, data);
      return { signature, nonce, deadline };
    } catch (e: any) {
      throw new Error('There is a problem in signing this claim', { cause: e });
    }
  }

  async allocateDFCFund(transactionHash: string): Promise<{ transactionHash: string }> {
    try {
      const txDetails = await this.prisma.bridgeEventTransactions.findFirst({
        where: {
          transactionHash,
        },
      });

      // check if tx details are available in db
      if (!txDetails) {
        throw new Error('Transaction detail not available');
      }

      // check if fund is already allocated for the given address
      if (txDetails.sendTransactionHash) {
        throw new Error('Fund already allocated');
      }

      // check if txn is confirmed or not
      if (txDetails.status !== EthereumTransactionStatus.CONFIRMED) {
        throw new Error('Transaction is not yet confirmed');
      }

      const txReceipt = await this.ethersRpcProvider.getTransactionReceipt(transactionHash);
      if (!txReceipt) {
        throw new Error('Transaction is not yet available');
      }
      const isReverted = txReceipt.status === 0;

      if (isReverted === true) {
        throw new BadRequestException(`Transaction Reverted`);
      }
      const currentBlockNumber = await this.ethersRpcProvider.getBlockNumber();
      const numberOfConfirmations = currentBlockNumber - txReceipt.blockNumber;

      // check if tx is confirmed with min required confirmation
      if (numberOfConfirmations < 65) {
        throw new Error('Transaction is not yet confirmed with min block threshold');
      }

      const onChainTxnDetail = await this.ethersRpcProvider.getTransaction(transactionHash);
      const { params } = decodeTxnData(onChainTxnDetail);
      const { _defiAddress: defiAddress, _tokenAddress: tokenAddress, _amount: amount } = params;
      const address = ethers.utils.toUtf8String(defiAddress);

      // check is send address belongs to current network or
      const decodedAddress = fromAddress(address, this.clientProvider.remapNetwork(this.network));
      if (decodedAddress === undefined) {
        throw new Error(`Invalid send address for DeFiChain ${this.network}`);
      }

      const evmTokenContract = new ethers.Contract(tokenAddress, ERC20__factory.abi, this.ethersRpcProvider);
      const wTokenSymbol = await evmTokenContract.symbol();
      const wTokenDecimals = await evmTokenContract.decimals();
      const transferAmount = new BigNumber(amount).dividedBy(new BigNumber(10).pow(wTokenDecimals));
      const dTokenDetails = getDTokenDetailsByWToken(wTokenSymbol, this.network);
      const sendTransactionHash = await this.sendService.send(address, {
        ...dTokenDetails,
        amount: transferAmount,
      });
      // update status in db
      await this.prisma.bridgeEventTransactions.update({
        where: {
          id: txDetails.id,
        },
        data: {
          sendTransactionHash,
        },
      });
      return { transactionHash: sendTransactionHash };
    } catch (e: any) {
      throw new HttpException(
        {
          status: e.code || HttpStatus.INTERNAL_SERVER_ERROR,
          error: `There is a problem in allocating fund: ${e.message}`,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: e,
        },
      );
    }
  }
}

const decodeTxnData = (txDetail: ethers.providers.TransactionResponse) => {
  const iface = new ethers.utils.Interface(BridgeV2__factory.abi);
  const decodedData = iface.parseTransaction({ data: txDetail.data, value: txDetail.value });
  const fragment = iface.getFunction(decodedData.name);
  const params = decodedData.args.reduce((res, param, i) => {
    let parsedParam = param;
    const isUint = fragment.inputs[i].type.indexOf('uint') === 0;
    const isInt = fragment.inputs[i].type.indexOf('int') === 0;
    const isAddress = fragment.inputs[i].type.indexOf('address') === 0;

    if (isUint || isInt) {
      const isArray = Array.isArray(param);

      if (isArray) {
        parsedParam = param.map((val) => EthBigNumber.from(val).toString());
      } else {
        parsedParam = EthBigNumber.from(param).toString();
      }
    }

    // Addresses returned by web3 are randomly cased so we need to standardize and lowercase all
    if (isAddress) {
      const isArray = Array.isArray(param);
      if (isArray) {
        parsedParam = param.map((_) => _.toLowerCase());
      } else {
        parsedParam = param.toLowerCase();
      }
    }
    return {
      ...res,
      [fragment.inputs[i].name]: parsedParam,
    };
  }, {});

  return {
    params,
    name: decodedData.name,
  };
};

interface SignClaim {
  receiverAddress: string;
  tokenAddress: string;
  amount: string;
}

export interface HandledEVMTransaction {
  numberOfConfirmations: number;
  isConfirmed: boolean;
}
