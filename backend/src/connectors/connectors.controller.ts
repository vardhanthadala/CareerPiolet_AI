import { Controller, Post, Body, Param } from '@nestjs/common';
import { ConnectorsService } from './connectors.service';
import { JSearchService } from './jsearch/jsearch.service';
import { AdzunaService } from './adzuna/adzuna.service';

@Controller('api/connectors')
export class ConnectorsController {
  constructor(
    private readonly connectorsService: ConnectorsService,
    private readonly jSearchService: JSearchService,
    private readonly adzunaService: AdzunaService,
  ) {}

  @Post('fetch/:companyId')
  async fetchForCompany(@Param('companyId') companyId: string) {
    return this.connectorsService.fetchAndStoreForCompany(companyId);
  }

  @Post('fetch-all')
  async fetchAll() {
    return this.connectorsService.fetchAndStoreAll();
  }

  @Post('jsearch')
  async fetchJSearch(@Body('query') query: string = 'Software Engineer') {
    return this.jSearchService.searchAndStore(query, 1);
  }

  @Post('adzuna')
  async fetchAdzuna(@Body('query') query: string = 'Software Engineer') {
    return this.adzunaService.searchAndStore(query, 20);
  }
}
