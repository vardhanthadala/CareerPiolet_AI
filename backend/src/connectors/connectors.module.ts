import { Module } from '@nestjs/common';
import { ConnectorsController } from './connectors.controller';
import { ConnectorsService } from './connectors.service';
import { GreenhouseConnector } from './greenhouse/greenhouse.connector';
import { LeverConnector } from './lever/lever.connector';
import { AshbyConnector } from './ashby/ashby.connector';
import { JSearchService } from './jsearch/jsearch.service';
import { AdzunaService } from './adzuna/adzuna.service';

@Module({
  controllers: [ConnectorsController],
  providers: [
    ConnectorsService,
    GreenhouseConnector,
    LeverConnector,
    AshbyConnector,
    JSearchService,
    AdzunaService,
  ],
  exports: [ConnectorsService, JSearchService, AdzunaService],
})
export class ConnectorsModule {}
