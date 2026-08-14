import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { IJobConnector, NormalizedJob } from '../connector.interface';

/**
 * Lever Public Postings API connector.
 *
 * API: GET https://api.lever.co/v0/postings/{company_slug}?mode=json
 * Auth: None required (public endpoint)
 */
@Injectable()
export class LeverConnector implements IJobConnector {
  readonly source = 'lever';
  private readonly logger = new Logger(LeverConnector.name);
  private readonly baseUrl = 'https://api.lever.co/v0/postings';

  async fetchJobs(companySlug: string): Promise<NormalizedJob[]> {
    try {
      this.logger.log(`Fetching jobs from Lever: ${companySlug}`);

      const response = await axios.get(
        `${this.baseUrl}/${companySlug}?mode=json`,
        { timeout: 30000 },
      );

      const jobs = Array.isArray(response.data) ? response.data : [];
      this.logger.log(`Found ${jobs.length} jobs from Lever/${companySlug}`);

      return jobs.map((job: any) => this.normalize(job, companySlug));
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch from Lever/${companySlug}: ${error.message}`,
      );
      return [];
    }
  }

  private normalize(job: any, company: string): NormalizedJob {
    const descriptionHtml = [
      job.descriptionPlain || '',
      ...(job.lists || []).map(
        (list: any) =>
          `${list.text || ''}\n${(list.content || '').replace(/<[^>]*>/g, ' ')}`,
      ),
      job.additional || '',
    ].join('\n\n');

    return {
      source: this.source,
      externalId: job.id || String(Date.now()),
      title: job.text || 'Untitled',
      company,
      location: job.categories?.location || undefined,
      workplaceType: this.parseWorkplaceType(
        job.workplaceType || job.categories?.location,
      ),
      description: job.descriptionPlain || job.description || '',
      descriptionPlain: descriptionHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
      jobUrl: job.hostedUrl || undefined,
      applicationUrl: job.applyUrl || job.hostedUrl || undefined,
      department: job.categories?.department || undefined,
      team: job.categories?.team || undefined,
      commitment: job.categories?.commitment || undefined,
      postedAt: job.createdAt ? new Date(job.createdAt) : undefined,
    };
  }

  private parseWorkplaceType(
    value?: string,
  ): 'ONSITE' | 'REMOTE' | 'HYBRID' | undefined {
    if (!value) return undefined;
    const lower = value.toLowerCase();
    if (lower.includes('remote')) return 'REMOTE';
    if (lower.includes('hybrid')) return 'HYBRID';
    if (lower.includes('onsite') || lower.includes('on-site')) return 'ONSITE';
    return undefined;
  }
}
