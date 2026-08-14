import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NormalizedJob } from '../connector.interface';
import { AtsType } from '@prisma/client';
import axios from 'axios';

@Injectable()
export class AdzunaService {
  private readonly logger = new Logger(AdzunaService.name);
  private readonly apiUrl = 'https://api.adzuna.com/v1/api/jobs/us/search/1';
  private readonly appId = process.env.ADZUNA_APP_ID;
  private readonly appKey = process.env.ADZUNA_APP_KEY;

  constructor(private prisma: PrismaService) {}

  /**
   * Search jobs via Adzuna API and store them.
   */
  async searchAndStore(query: string, resultsPerPage = 20): Promise<{ fetched: number; new: number; updated: number }> {
    if (!this.appId || !this.appKey) {
      this.logger.error('ADZUNA_APP_ID or ADZUNA_APP_KEY is not defined in environment variables');
      return { fetched: 0, new: 0, updated: 0 };
    }

    try {
      this.logger.log(`Searching Adzuna for: "${query}"`);
      
      const response = await axios.get(this.apiUrl, {
        params: {
          app_id: this.appId,
          app_key: this.appKey,
          results_per_page: resultsPerPage,
          what: query,
        }
      });

      const data = response.data?.results || [];
      this.logger.log(`Adzuna returned ${data.length} jobs for query "${query}"`);

      let newCount = 0;
      let updatedCount = 0;

      for (const job of data) {
        // Format the job
        const employerName = job.company?.display_name || 'Unknown Company';
        
        // Find or create company
        let company = await this.prisma.company.findFirst({
          where: {
            atsType: AtsType.ADZUNA,
            atsIdentifier: employerName,
          }
        });

        if (!company) {
          company = await this.prisma.company.create({
            data: {
              name: employerName,
              atsType: AtsType.ADZUNA,
              atsIdentifier: employerName,
            }
          });
        }

        // Normalize job data
        const normalizedJob: NormalizedJob = {
          source: 'adzuna',
          externalId: job.id.toString(),
          title: job.title,
          company: company.id,
          location: job.location?.display_name || 'Unknown',
          workplaceType: undefined, // Adzuna doesn't always specify
          description: job.description || '',
          descriptionPlain: job.description || '',
          salaryMin: job.salary_min || null,
          salaryMax: job.salary_max || null,
          salaryCurrency: 'USD',
          jobUrl: job.redirect_url,
          applicationUrl: job.redirect_url,
          postedAt: job.created ? new Date(job.created) : undefined,
        };

        // Upsert job
        try {
          const result = await this.prisma.job.upsert({
            where: {
              source_externalId: {
                source: normalizedJob.source,
                externalId: normalizedJob.externalId,
              },
            },
            create: {
              source: normalizedJob.source,
              externalId: normalizedJob.externalId,
              title: normalizedJob.title,
              companyId: company.id,
              location: normalizedJob.location,
              workplaceType: normalizedJob.workplaceType as any,
              description: normalizedJob.description,
              descriptionPlain: normalizedJob.descriptionPlain,
              salaryMin: normalizedJob.salaryMin,
              salaryMax: normalizedJob.salaryMax,
              salaryCurrency: normalizedJob.salaryCurrency,
              jobUrl: normalizedJob.jobUrl,
              applicationUrl: normalizedJob.applicationUrl,
              postedAt: normalizedJob.postedAt,
              fetchedAt: new Date(),
            },
            update: {
              title: normalizedJob.title,
              location: normalizedJob.location,
              workplaceType: normalizedJob.workplaceType as any,
              description: normalizedJob.description,
              descriptionPlain: normalizedJob.descriptionPlain,
              salaryMin: normalizedJob.salaryMin,
              salaryMax: normalizedJob.salaryMax,
              salaryCurrency: normalizedJob.salaryCurrency,
              jobUrl: normalizedJob.jobUrl,
              applicationUrl: normalizedJob.applicationUrl,
              postedAt: normalizedJob.postedAt,
              fetchedAt: new Date(),
            },
          });

          if (
            result.createdAt.getTime() === result.updatedAt.getTime() ||
            new Date().getTime() - result.createdAt.getTime() < 5000
          ) {
            newCount++;
          } else {
            updatedCount++;
          }
        } catch (jobError: any) {
          this.logger.error(`Failed to store Adzuna job ${normalizedJob.externalId}: ${jobError.message}`);
        }
      }

      return { fetched: data.length, new: newCount, updated: updatedCount };
    } catch (error: any) {
      this.logger.error(`Error fetching from Adzuna: ${error.message}`);
      return { fetched: 0, new: 0, updated: 0 };
    }
  }
}
