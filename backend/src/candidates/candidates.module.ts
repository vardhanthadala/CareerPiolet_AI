import { Module } from '@nestjs/common';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';
import { S3StorageService } from './s3-storage.service';

@Module({
  controllers: [CandidatesController],
  providers: [CandidatesService, S3StorageService],
  exports: [CandidatesService, S3StorageService],
})
export class CandidatesModule {}
