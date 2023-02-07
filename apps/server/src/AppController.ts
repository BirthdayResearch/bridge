import { Controller, Get, Query } from '@nestjs/common';
import { BigNumber, Event } from 'ethers';

import { AppService } from './AppService';

@Controller('app')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('blockheight')
  async getBlockHeight(): Promise<number> {
    return this.appService.getBlockHeight();
  }

  @Get('balance')
  async getBalance(@Query('address') address: string): Promise<BigNumber> {
    return this.appService.getBalance(address);
  }

  @Get('getAllEventsFromBlockNumber')
  async getAllEventsFromBlockNumber(@Query('blockNumber') blockNumber: number): Promise<Event[]> {
    return this.appService.getAllEventsFromBlockNumber(Number(blockNumber));
  }

  @Get('sign-data')
  async signData(@Query() query: { tokenAddress: string; amount: string }): Promise<string> {
    return this.appService.signData(query.tokenAddress, query.amount);
  }
}
