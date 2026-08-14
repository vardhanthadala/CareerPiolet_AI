import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { IJobConnector, NormalizedJob } from '../connector.interface';

/**
 * Greenhouse Job Board API connector.
 *
 * API: GET https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true
 * Auth: None required (public endpoint)
 * Docs: https://developers.greenhouse.io/job-board.html
 */
@Injectable()
export class GreenhouseConnector implements IJobConnector {
  readonly source = 'greenhouse';
  private readonly logger = new Logger(GreenhouseConnector.name);
  private readonly baseUrl = 'https://boards-api.greenhouse.io/v1/boards';

  async fetchJobs(boardToken: string): Promise<NormalizedJob[]> {
    try {
      this.logger.log(`Fetching jobs from Greenhouse: ${boardToken}`);

      const response = await axios.get(
        `${this.baseUrl}/${boardToken}/jobs?content=true`,
        { timeout: 30000 },
      );

      const jobs = response.data?.jobs || [];
      this.logger.log(`Found ${jobs.length} jobs from Greenhouse/${boardToken}`);

      return jobs.map((job: any) => this.normalize(job, boardToken));
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch from Greenhouse/${boardToken}: ${error.message}`,
      );
      return [];
    }
  }

  private normalize(job: any, company: string): NormalizedJob {
    // Strip HTML tags for plain text
    const plainDescription = this.stripHtml(job.content || '');

    return {
      source: this.source,
      externalId: String(job.id),
      title: job.title || 'Untitled',
      company,
      location: job.location?.name || undefined,
      workplaceType: this.parseWorkplaceType(job.location?.name),
      description: job.content || '',
      descriptionPlain: plainDescription,
      jobUrl: job.absolute_url || undefined,
      applicationUrl: job.absolute_url || undefined,
      department: job.departments?.[0]?.name || undefined,
      postedAt: job.updated_at ? new Date(job.updated_at) : undefined,
    };
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private parseWorkplaceType(
    location?: string,
  ): 'ONSITE' | 'REMOTE' | 'HYBRID' | undefined {
    if (!location) return undefined;
    const lower = location.toLowerCase();
    if (lower.includes('remote')) return 'REMOTE';
    if (lower.includes('hybrid')) return 'HYBRID';
    return 'ONSITE';
  }
}
