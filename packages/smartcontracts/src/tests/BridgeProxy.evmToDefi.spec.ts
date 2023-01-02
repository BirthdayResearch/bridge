import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { BridgeV1, TestToken } from '../generated';
import { calculateFee, deployContracts, toWei } from './testHelper';

// initMintAndSupport will mint to the EOA address and approve contractAddress.
// This is primarily to help avoid the repetition of code
async function initMintAndSupport(
  proxyBridge: BridgeV1,
  testToken: TestToken,
  eoaAddress: string,
  contractAddress: string,
) {
  await testToken.mint(eoaAddress, toWei('100'));
  await testToken.approve(contractAddress, ethers.constants.MaxInt256);
  // Daily allowance amount set to 15 testToken
  await proxyBridge.addSupportedTokens(testToken.address, ethers.utils.parseEther('15'));
}
describe('EVM --> DeFiChain', () => {
  describe('Bridging ERC20 token', () => {
    it('Bridge request before adding support for ERC20 token', async () => {
      const { proxyBridge, testToken } = await loadFixture(deployContracts);
      // Will need to figure why DFI address On it's own failing Even when adding 0x and 0x00
      // @dev will look into later
      await expect(
        proxyBridge.bridgeToDeFiChain(
          ethers.utils.toUtf8Bytes('8defichainBurnAddressXXXXXXXdRQkSm'),
          testToken.address,
          toWei('10'),
        ),
      ).to.be.revertedWith('BC002');
    });

    it('Successfully revert if bridging amount exceeds daily allowance', async () => {
      const { proxyBridge, testToken, defaultAdminSigner } = await loadFixture(deployContracts);
      await initMintAndSupport(proxyBridge, testToken, defaultAdminSigner.address, proxyBridge.address);
      // Testing with testToken (already added in supported token)
      // Daily allowance is 15. Should revert with the error if exceeding daily allowance
      // Current daily usage should be zero
      expect((await proxyBridge.tokenAllowances(testToken.address)).currentDailyUsage).to.equal(0);
      // Bridging 15 token to defiChain. After this txn only able to bridge dailyAllowance(15) - 15 = 0 tokens
      await proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('15'));
      // Initial balance is 100, should be 85.
      expect(await testToken.balanceOf(defaultAdminSigner.address)).to.equal(toWei('85'));
      // Current daily usage should be 15
      expect((await proxyBridge.tokenAllowances(testToken.address)).currentDailyUsage).to.equal(toWei('15'));
      // This txn should revert if the exceeding daily balance of 15
      await expect(
        proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('20')),
      ).to.revertedWith('BC004');
      // Current daily usage should be 15. Above txn didn't succeed
      expect((await proxyBridge.tokenAllowances(testToken.address)).currentDailyUsage).to.equal(toWei('15'));
    });

    it('Successfully bridging after a day', async () => {
      const { proxyBridge, testToken, defaultAdminSigner } = await loadFixture(deployContracts);
      await initMintAndSupport(proxyBridge, testToken, defaultAdminSigner.address, proxyBridge.address);
      // Testing with testToken (already added in supported token)
      // Daily allowance is 15. Should revert with the error if exceeding daily allowance
      // Current daily usage should be zero
      expect((await proxyBridge.tokenAllowances(testToken.address)).currentDailyUsage).to.equal(0);
      // Bridging 15 token to defiChain. After this txn only able to bridge dailyAllowance(15) - 15 = 0 tokens
      await proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('15'));
      // Initial balance is 100, should be 85.
      expect(await testToken.balanceOf(defaultAdminSigner.address)).to.equal(toWei('85'));
      // Current daily usage should be 15
      expect((await proxyBridge.tokenAllowances(testToken.address)).currentDailyUsage).to.equal(toWei('15'));
      // This txn should revert if the exceeding daily balance of 15
      await expect(
        proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('20')),
      ).to.revertedWith('BC004');
      // Current daily usage should be 15. Above txn didn't succeed
      expect((await proxyBridge.tokenAllowances(testToken.address)).currentDailyUsage).to.equal(toWei('15'));
      // Waiting for a day to reset the allowance.
      await time.increase(60 * 60 * 25);
      // After a day. Bridging 12 token. Txn should not revert.
      await proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('12'));
      // This txn should revert if the exceeding daily balance of 15
      await expect(
        proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('4')),
      ).to.revertedWith('BC004');
      // Current daily usage should be 12
      expect((await proxyBridge.tokenAllowances(testToken.address)).currentDailyUsage).to.equal(toWei('12'));
      // Bridging 3 token again. Txn should not revert.
      await proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('3'));
      // Current daily usage should be 15
      expect((await proxyBridge.tokenAllowances(testToken.address)).currentDailyUsage).to.equal(toWei('15'));
    });

    it('Successfully bridging over multiple days', async () => {
      const { proxyBridge, testToken, defaultAdminSigner } = await loadFixture(deployContracts);
      await initMintAndSupport(proxyBridge, testToken, defaultAdminSigner.address, proxyBridge.address);
      const prevAllowance = await proxyBridge.tokenAllowances(testToken.address);
      let tx = await proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('10'));
      await tx.wait();
      tx = await proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('2'));
      await tx.wait();
      // Increasing time by 2 days and an hr (In seconds)
      await time.increase(60 * 60 * 49);
      tx = await proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('9'));
      await tx.wait();
      // Increasing time by 1 day (In seconds)
      await time.increase(60 * 60 * 24);
      tx = await proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('14'));
      const allowance = await proxyBridge.tokenAllowances(testToken.address);

      // Checking previous epoch
      expect(allowance[0]).to.equal(prevAllowance[0].add(60 * 60 * 72));
      // Checking daily allowance
      expect(allowance[1]).to.equal(toWei('15'));
      // Checking current daily usage
      expect(allowance[2]).to.equal(toWei('14'));
      // Checking the change allowance period
      expect(allowance[3]).to.equal(false);
    });

    it('Successfully emitted event when bridging to defiChain', async () => {
      const { proxyBridge, testToken, defaultAdminSigner } = await loadFixture(deployContracts);
      await initMintAndSupport(proxyBridge, testToken, defaultAdminSigner.address, proxyBridge.address);
      // Event called BRIDGE_TO_DEFI_CHAIN should be emitted when Successfully bridged token to DefiChain
      // Getting timestamp
      const blockNumBefore = await ethers.provider.getBlockNumber();
      const blockBefore = await ethers.provider.getBlock(blockNumBefore);
      // Need to add to the timestamp of the previous block to match the next block the tx is mined in
      const expectedTimestamp = blockBefore.timestamp + 1;
      // Getting decimal power from random token and tx fee from the bridged contract.
      const txFee = await proxyBridge.transactionFee();
      // Calculating amount after tx fees
      const netAmountAfterFee = calculateFee(toWei('10'), txFee);
      // Sending 15 Eth as well. Users must not send ERC20 token and ETH together. Depending on token address - only the respected token will be added.
      await expect(
        proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('10'), {
          value: toWei('15'),
        }),
      )
        .to.emit(proxyBridge, 'BRIDGE_TO_DEFI_CHAIN')
        .withArgs(ethers.constants.AddressZero, testToken.address, netAmountAfterFee, expectedTimestamp);
    });

    it('No deposit to DefiChain if in change allowance period', async () => {
      const { proxyBridge, testToken, defaultAdminSigner } = await loadFixture(deployContracts);
      await initMintAndSupport(proxyBridge, testToken, defaultAdminSigner.address, proxyBridge.address);
      // Checking if the inChangeAllowancePeriod is false
      expect((await proxyBridge.tokenAllowances(ethers.constants.AddressZero)).inChangeAllowancePeriod).to.equal(false);
      // Changing allowance from 15 to 20 for testToken
      await proxyBridge.changeDailyAllowance(testToken.address, 20);
      // Check if the allowance has been changed to 20
      expect((await proxyBridge.tokenAllowances(testToken.address)).dailyAllowance).to.equal(20);
      // Confirming inChangeAllowancePeriod is true
      expect((await proxyBridge.tokenAllowances(testToken.address)).inChangeAllowancePeriod).to.equal(true);
      // This txn should be revert with the error "B000"
      // Sending 11 Ether to the bridge
      await expect(proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, 11)).to.revertedWith(
        'BC000',
      );
    });
  });

  describe('Bridging ETH token', () => {
    it('Bridge request before adding support for ETH token', async () => {
      const { proxyBridge } = await loadFixture(deployContracts);
      // This txn should be revert if no allowance added
      // Sending 1 Ether
      await expect(
        proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, ethers.constants.AddressZero, 0, {
          value: toWei('1'),
        }),
      ).to.revertedWith('BC002');
    });

    it('Successfully revert if bridging amount exceeds daily allowance', async () => {
      const { proxyBridge } = await loadFixture(deployContracts);
      // Set Allowance to 10 ether
      await proxyBridge.addSupportedTokens(ethers.constants.AddressZero, 10);
      // This txn should be revert with "BC004"
      // Sending 11 Ether to the bridge
      await expect(
        proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, ethers.constants.AddressZero, 0, {
          value: toWei('11'),
        }),
      ).to.revertedWith('BC004');
    });

    it('Successfully bridging to DefiChain', async () => {
      const { proxyBridge } = await loadFixture(deployContracts);
      // set allowance to 10 Ether
      await proxyBridge.addSupportedTokens(ethers.constants.AddressZero, toWei('10'));
      // Checking ETHER balance before bridging. Must be 0
      expect(await ethers.provider.getBalance(proxyBridge.address)).to.equal(0);
      // Bridging 5 ether
      await proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, ethers.constants.AddressZero, 0, {
        value: toWei('5'),
      });
      // Proxied bridge contract must have the 5 ether now
      expect(await ethers.provider.getBalance(proxyBridge.address)).to.equal(toWei('5'));
    });

    it('Successfully emitting events upon bridging', async () => {
      // set allowance to 10 Ether
      const { proxyBridge } = await loadFixture(deployContracts);
      await proxyBridge.addSupportedTokens(ethers.constants.AddressZero, toWei('10'));
      // Getting timestamp
      const blockNumBefore = await ethers.provider.getBlockNumber();
      const blockBefore = await ethers.provider.getBlock(blockNumBefore);
      // This is the pervious block, need to add the other block to match the coming tx's block
      const timestampBefore = blockBefore.timestamp + 1;
      // Tx fee
      const txFee = await proxyBridge.transactionFee();
      // Calculating amount after tx fees
      const netAmountAfterFee = calculateFee(toWei('3'), txFee);
      // Emitting an event "BRIDGE_TO_DEFI_CHAIN"
      // Users sending ETH can put any "_amount". Only "value" amount will be counted
      await expect(
        proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, ethers.constants.AddressZero, toWei('5'), {
          value: toWei('3'),
        }),
      )
        .to.emit(proxyBridge, 'BRIDGE_TO_DEFI_CHAIN')
        .withArgs(ethers.constants.AddressZero, ethers.constants.AddressZero, netAmountAfterFee, timestampBefore);
    });

    it('No Bridging to DefiChain if in change allowance period', async () => {
      const { proxyBridge, defaultAdminSigner } = await loadFixture(deployContracts);
      // Checking if the inChangeAllowancePeriod is false
      expect(await (await proxyBridge.tokenAllowances(ethers.constants.AddressZero)).inChangeAllowancePeriod).to.equal(
        false,
      );
      // Set Allowance to 10 ether by admin address
      await proxyBridge.connect(defaultAdminSigner).addSupportedTokens(ethers.constants.AddressZero, 10);
      // Changing allowance to set the notInChangeAllowancePeriod to 'True'
      await proxyBridge.connect(defaultAdminSigner).changeDailyAllowance(ethers.constants.AddressZero, 15);
      // Check if the allowance has been changed to 15
      expect(await (await proxyBridge.tokenAllowances(ethers.constants.AddressZero)).dailyAllowance).to.equal(15);
      expect(await (await proxyBridge.tokenAllowances(ethers.constants.AddressZero)).inChangeAllowancePeriod).to.equal(
        true,
      );
      // This txn should be revert with the error "B000"
      // Sending 11 Ether to the bridge
      await expect(
        proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, ethers.constants.AddressZero, 0, {
          value: toWei('11'),
        }),
      ).to.revertedWith('BC000');
    });
  });
});
