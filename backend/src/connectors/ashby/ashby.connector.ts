import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { IJobConnector, NormalizedJob } from '../connector.interface';

/**
 * Ashby Public Job Board API connector.
 *
 * API: GET https://api.ashbyhq.com/posting-api/job-board/{board_name}
 * Auth: None required (public endpoint)
 */
@Injectable()
export class AshbyConnector implements IJobConnector {
  readonly source = 'ashby';
  private readonly logger = new Logger(AshbyConnector.name);
  private readonly baseUrl = 'https://api.ashbyhq.com/posting-api/job-board';

  async fetchJobs(boardName: string): Promise<NormalizedJob[]> {
    try {
      this.logger.log(`Fetching jobs from Ashby: ${boardName}`);

      const response = await axios.get(
        `${this.baseUrl}/${boardName}?includeCompensation=true`,
        { timeout: 30000 },
      );

      const jobs = response.data?.jobs || [];
      this.logger.log(`Found ${jobs.length} jobs from Ashby/${boardName}`);

      return jobs.map((job: any) => this.normalize(job, boardName));
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch from Ashby/${boardName}: ${error.message}`,
      );
      return [];
    }
  }

  private normalize(job: any, company: string): NormalizedJob {
    const compensation = job.compensation;
    let salaryMin: number | undefined;
    let salaryMax: number | undefined;
    let salaryCurrency: string | undefined;

    if (compensation) {
      salaryMin = compensation.compensationTierSummary?.[0]?.min;
      salaryMax = compensation.compensationTierSummary?.[0]?.max;
      salaryCurrency = compensation.compensationTierSummary?.[0]?.currency;
    }

    return {
      source: this.source,
      externalId: job.id || String(Date.now()),
      title: job.title || 'Untitled',
      company,
      location: job.location || undefined,
      workplaceType: this.parseWorkplaceType(job.isRemote, job.location),
      description: job.descriptionHtml || job.descriptionPlain || '',
      descriptionPlain:
        (job.descriptionPlain || job.descriptionHtml || '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim(),
      salaryMin,
      salaryMax,
      salaryCurrency,
      jobUrl: job.jobUrl || undefined,
      applicationUrl: job.applyUrl || job.jobUrl || undefined,
      department: job.department || undefined,
      team: job.team || undefined,
      commitment: job.employmentType || undefined,
      postedAt: job.publishedAt ? new Date(job.publishedAt) : undefined,
    };
  }

  private parseWorkplaceType(
    isRemote?: boolean,
    location?: string,
  ): 'ONSITE' | 'REMOTE' | 'HYBRID' | undefined {
    if (isRemote) return 'REMOTE';
    if (!location) return undefined;
    const lower = location.toLowerCase();
    if (lower.includes('remote')) return 'REMOTE';
    if (lower.includes('hybrid')) return 'HYBRID';
    return 'ONSITE';
  }
}
