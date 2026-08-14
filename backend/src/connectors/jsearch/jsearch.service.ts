import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NormalizedJob } from '../connector.interface';
import { AtsType } from '@prisma/client';
import axios from 'axios';

@Injectable()
export class JSearchService {
  private readonly logger = new Logger(JSearchService.name);
  private readonly apiUrl = 'https://jsearch.p.rapidapi.com/search';
  private readonly apiKey = process.env.JSEARCH_API_KEY;
  private readonly apiHost = 'jsearch.p.rapidapi.com';

  constructor(private prisma: PrismaService) {}

  /**
   * Search jobs via JSearch RapidAPI and store them.
   */
  async searchAndStore(query: string, numPages = 1): Promise<{ fetched: number; new: number; updated: number }> {
    if (!this.apiKey) {
      this.logger.error('JSEARCH_API_KEY is not defined in environment variables');
      return { fetched: 0, new: 0, updated: 0 };
    }

    try {
      this.logger.log(`Searching JSearch for: "${query}"`);
      
      const response = await axios.get(this.apiUrl, {
        params: {
          query,
          page: '1',
          num_pages: numPages.toString(),
        },
        headers: {
          'x-rapidapi-key': this.apiKey,
          'x-rapidapi-host': this.apiHost,
        },
      });

      const data = response.data?.data || [];
      this.logger.log(`JSearch returned ${data.length} jobs for query "${query}"`);

      let newCount = 0;
      let updatedCount = 0;

      for (const job of data) {
        // Format the job
        const employerName = job.employer_name || 'Unknown Company';
        
        // Find or create company
        let company = await this.prisma.company.findFirst({
          where: {
            atsType: AtsType.JSEARCH,
            atsIdentifier: employerName,
          }
        });

        if (!company) {
          company = await this.prisma.company.create({
            data: {
              name: employerName,
              atsType: AtsType.JSEARCH,
              atsIdentifier: employerName,
              careersUrl: job.employer_website,
              logoUrl: job.employer_logo,
            }
          });
        }

        // Normalize job data
        const normalizedJob: NormalizedJob = {
          source: 'jsearch',
          externalId: job.job_id,
          title: job.job_title,
          company: company.id, // Using company.id because we'll pass this directly to our upsert
          location: [job.job_city, job.job_state, job.job_country].filter(Boolean).join(', '),
          workplaceType: job.job_is_remote ? 'REMOTE' : 'ONSITE',
          description: job.job_description,
          descriptionPlain: job.job_description,
          salaryMin: job.job_min_salary,
          salaryMax: job.job_max_salary,
          salaryCurrency: job.job_salary_currency,
          jobUrl: job.job_apply_link,
          applicationUrl: job.job_apply_link,
          postedAt: job.job_posted_at_datetime_utc ? new Date(job.job_posted_at_datetime_utc) : undefined,
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
          this.logger.error(`Failed to store JSearch job ${normalizedJob.externalId}: ${jobError.message}`);
        }
      }

      return { fetched: data.length, new: newCount, updated: updatedCount };
    } catch (error: any) {
      this.logger.error(`Error fetching from JSearch: ${error.message}`);
      return { fetched: 0, new: 0, updated: 0 };
    }
  }
}
