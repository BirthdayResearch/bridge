import { fromAddress } from '@defichain/jellyfish-address';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { getJellyfishNetwork } from '@waveshq/walletkit-core';
import { EnvironmentNetwork } from '@waveshq/walletkit-core/dist/api/environment';
import BigNumber from 'bignumber.js';
import { CustomErrorCodes } from 'src/CustomErrorCodes';

import { Prisma } from '../../prisma/Client';
import { VerifyDto } from '../model/VerifyDto';
import { WhaleWalletProvider } from '../providers/WhaleWalletProvider';

@Injectable()
export class WhaleWalletService {
  constructor(private readonly whaleWalletProvider: WhaleWalletProvider) {}

  async verify(
    verify: VerifyDto,
    network: EnvironmentNetwork = EnvironmentNetwork.MainNet,
  ): Promise<{ isValid: boolean; statusCode?: CustomErrorCodes }> {
    // Verify if the address is valid
    const { isAddressValid } = this.verifyValidAddress(verify.address, network);
    if (!isAddressValid) {
      return { isValid: false, statusCode: CustomErrorCodes.AddressNotValid };
    }

    try {
      const pathIndex = await Prisma.pathIndex.findFirst({
        where: {
          network,
          address: verify.address,
        },
        orderBy: [{ index: 'desc' }],
      });

      // Address not found in the selected network
      if (pathIndex === null) {
        return { isValid: false, statusCode: CustomErrorCodes.AddressNotFound };
      }

      // Verify that the address is owned by the wallet
      const wallet = this.whaleWalletProvider.createWallet(network, pathIndex.index);
      const address = await wallet.getAddress();

      if (address !== verify.address) {
        return { isValid: false, statusCode: CustomErrorCodes.AddressNotOwned };
      }

      const tokens = await wallet.client.address.listToken(address);
      const token = tokens.find((t) => t.symbol === verify.symbol);

      // If no amount has been received yet
      if (token === undefined || new BigNumber(token?.amount).isZero()) {
        return { isValid: false, statusCode: CustomErrorCodes.IsZeroBalance };
      }

      // Verify that the amount === token balance
      if (new BigNumber(verify.amount).isEqualTo(token?.amount)) {
        return { isValid: false, statusCode: CustomErrorCodes.BalanceNotMatched };
      }

      return { isValid: true };
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'There is a problem in verifying the address',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: error as Error,
        },
      );
    }
  }

  async generateAddress(network: EnvironmentNetwork = EnvironmentNetwork.MainNet): Promise<{ address: string }> {
    try {
      const lastIndex = await Prisma.pathIndex.findFirst({
        where: {
          network,
        },
        orderBy: [{ index: 'desc' }],
      });
      const index = lastIndex?.index;
      const nextIndex = index ? index + 1 : 2;
      const wallet = this.whaleWalletProvider.createWallet(network, nextIndex);
      const address = await wallet.getAddress();
      await Prisma.pathIndex.create({
        data: {
          index: nextIndex,
          address,
          network,
        },
      });
      return { address };
    } catch (e: any) {
      // TODO: Improve error handling
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'There is a problem in generating an address',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: e,
        },
      );
    }
  }

  private verifyValidAddress(address: string, network: EnvironmentNetwork): { isAddressValid: boolean } {
    const decodedAddress = fromAddress(address, getJellyfishNetwork(network).name);

    return { isAddressValid: decodedAddress !== undefined };
  }
}
