import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NormalizedJob } from '../connector.interface';
import { AtsType } from '@prisma/client';
import axios from 'axios';

@Injectable()
export class AdzunaService {
  private readonly logger = new Logger(AdzunaService.name);
  private readonly appId = process.env.ADZUNA_APP_ID;
  private readonly appKey = process.env.ADZUNA_APP_KEY;

  constructor(private prisma: PrismaService) {}

  /**
   * Search jobs via Adzuna API for US and UK locations and store them.
   */
  async searchAndStore(query: string, resultsPerPage = 20): Promise<{ fetched: number; new: number; updated: number }> {
    if (!this.appId || !this.appKey) {
      this.logger.error('ADZUNA_APP_ID or ADZUNA_APP_KEY is not defined in environment variables');
      return { fetched: 0, new: 0, updated: 0 };
    }

    const countries = [
      { code: 'us', currency: 'USD' },
      { code: 'gb', currency: 'GBP' },
    ];

    let totalFetched = 0;
    let totalNew = 0;
    let totalUpdated = 0;

    for (const country of countries) {
      try {
        const apiUrl = `https://api.adzuna.com/v1/api/jobs/${country.code}/search/1`;
        this.logger.log(`Searching Adzuna (${country.code.toUpperCase()}) for: "${query}"`);

        const response = await axios.get(apiUrl, {
          params: {
            app_id: this.appId,
            app_key: this.appKey,
            results_per_page: Math.ceil(resultsPerPage / 2),
            what: query,
          },
        });

        const data = response.data?.results || [];
        this.logger.log(`Adzuna (${country.code.toUpperCase()}) returned ${data.length} jobs for query "${query}"`);
        totalFetched += data.length;

        for (const job of data) {
          // Format the job
          const employerName = job.company?.display_name || 'Unknown Company';

          // Find or create company
          let company = await this.prisma.company.findFirst({
            where: {
              atsType: AtsType.ADZUNA,
              atsIdentifier: employerName,
            },
          });

          if (!company) {
            company = await this.prisma.company.create({
              data: {
                name: employerName,
                atsType: AtsType.ADZUNA,
                atsIdentifier: employerName,
              },
            });
          }

          // Normalize job data
          const normalizedJob: NormalizedJob = {
            source: 'adzuna',
            externalId: job.id.toString(),
            title: job.title,
            company: company.id,
            location: `${job.location?.display_name || 'Unknown'}, ${country.code.toUpperCase()}`,
            workplaceType: undefined, // Adzuna doesn't always specify
            description: job.description || '',
            descriptionPlain: job.description || '',
            salaryMin: job.salary_min || null,
            salaryMax: job.salary_max || null,
            salaryCurrency: country.currency,
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
            totalNew++;
          } else {
            totalUpdated++;
          }
        } catch (jobError: any) {
          this.logger.error(`Failed to store Adzuna job ${normalizedJob.externalId}: ${jobError.message}`);
        }
      }
    } catch (error: any) {
      this.logger.error(`Error fetching from Adzuna (${country.code.toUpperCase()}): ${error.message}`);
    }
  }

  return { fetched: totalFetched, new: totalNew, updated: totalUpdated };
}
}
