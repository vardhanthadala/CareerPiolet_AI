import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { ClerkAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/auth.decorator';

@Controller('api/jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  async search(
    @Query('query') query?: string,
    @Query('location') location?: string,
    @Query('workplaceType') workplaceType?: string,
    @Query('department') department?: string,
    @Query('companyId') companyId?: string,
    @Query('postedWithin') postedWithin?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    return this.jobsService.search({
      query,
      location,
      workplaceType,
      department,
      companyId,
      postedWithin,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      sortBy: (sortBy as any) || 'postedAt',
      sortOrder: (sortOrder as any) || 'desc',
    });
  }

  @Get('stats')
  async getStats() {
    return this.jobsService.getStats();
  }

  @Get('saved')
  @UseGuards(ClerkAuthGuard)
  async getSavedJobs(@CurrentUser('userId') userId: string) {
    return this.jobsService.getSavedJobs(userId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const job = await this.jobsService.findById(id);
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  @Post('save/:id')
  @UseGuards(ClerkAuthGuard)
  async saveJob(
    @CurrentUser('userId') userId: string,
    @Param('id') jobId: string,
  ) {
    return this.jobsService.saveJob(userId, jobId);
  }

  @Delete('save/:id')
  @UseGuards(ClerkAuthGuard)
  async unsaveJob(
    @CurrentUser('userId') userId: string,
    @Param('id') jobId: string,
  ) {
    return this.jobsService.unsaveJob(userId, jobId);
  }
}
