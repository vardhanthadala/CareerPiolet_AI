import { Controller, Get, Post, Body } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { AtsType } from '@prisma/client';

@Controller('api/companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  async findAll() {
    return this.companiesService.findAll();
  }

  @Post()
  async create(
    @Body()
    body: {
      name: string;
      atsType: AtsType;
      atsIdentifier: string;
      careersUrl?: string;
      logoUrl?: string;
      description?: string;
    },
  ) {
    return this.companiesService.create(body);
  }

  @Post('seed')
  async seed() {
    return this.companiesService.seedDefaults();
  }
}
