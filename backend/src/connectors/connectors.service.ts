import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GreenhouseConnector } from './greenhouse/greenhouse.connector';
import { LeverConnector } from './lever/lever.connector';
import { AshbyConnector } from './ashby/ashby.connector';
import { IJobConnector, NormalizedJob } from './connector.interface';
import { AtsType } from '@prisma/client';

@Injectable()
export class ConnectorsService {
  private readonly logger = new Logger(ConnectorsService.name);
  private readonly connectorMap: Record<string, IJobConnector>;

  constructor(
    private prisma: PrismaService,
    private greenhouse: GreenhouseConnector,
    private lever: LeverConnector,
    private ashby: AshbyConnector,
  ) {
    this.connectorMap = {
      GREENHOUSE: this.greenhouse,
      LEVER: this.lever,
      ASHBY: this.ashby,
    };
  }

  /**
   * Fetch jobs for a specific company and store them in the database.
   */
  async fetchAndStoreForCompany(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company || !company.active) {
      this.logger.warn(`Company ${companyId} not found or inactive`);
      return { fetched: 0, new: 0, updated: 0 };
    }

    const connector = this.connectorMap[company.atsType];
    if (!connector) {
      this.logger.error(`No connector for ATS type: ${company.atsType}`);
      return { fetched: 0, new: 0, updated: 0 };
    }

    const jobs = await connector.fetchJobs(company.atsIdentifier);
    this.logger.log(
      `Fetched ${jobs.length} jobs for ${company.name} (${company.atsType})`,
    );

    const result = await this.storeJobs(jobs, company.id);

    // Update last fetched timestamp
    await this.prisma.company.update({
      where: { id: company.id },
      data: { lastFetchedAt: new Date() },
    });

    return result;
  }

  /**
   * Fetch jobs for ALL active companies.
   */
  async fetchAndStoreAll() {
    const companies = await this.prisma.company.findMany({
      where: { active: true },
    });

    this.logger.log(`Fetching jobs for ${companies.length} active companies`);

    const results = [];
    for (const company of companies) {
      try {
        const result = await this.fetchAndStoreForCompany(company.id);
        results.push({
          company: company.name,
          atsType: company.atsType,
          ...result,
        });
      } catch (error: any) {
        this.logger.error(
          `Error fetching for ${company.name}: ${error.message}`,
        );
        results.push({
          company: company.name,
          atsType: company.atsType,
          error: error.message,
        });
      }

      // Respect rate limits — small delay between companies
      await this.delay(500);
    }

    return results;
  }

  /**
   * Store normalized jobs in the database using upsert (insert or update).
   * Deduplication is handled by the UNIQUE(source, externalId) constraint.
   */
  private async storeJobs(
    jobs: NormalizedJob[],
    companyId: string,
  ): Promise<{ fetched: number; new: number; updated: number }> {
    let newCount = 0;
    let updatedCount = 0;

    for (const job of jobs) {
      try {
        const result = await this.prisma.job.upsert({
          where: {
            source_externalId: {
              source: job.source,
              externalId: job.externalId,
            },
          },
          create: {
            source: job.source,
            externalId: job.externalId,
            title: job.title,
            companyId,
            location: job.location,
            workplaceType: job.workplaceType as any,
            description: job.description,
            descriptionPlain: job.descriptionPlain,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            salaryCurrency: job.salaryCurrency,
            jobUrl: job.jobUrl,
            applicationUrl: job.applicationUrl,
            department: job.department,
            team: job.team,
            commitment: job.commitment,
            postedAt: job.postedAt,
            fetchedAt: new Date(),
          },
          update: {
            title: job.title,
            location: job.location,
            workplaceType: job.workplaceType as any,
            description: job.description,
            descriptionPlain: job.descriptionPlain,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            salaryCurrency: job.salaryCurrency,
            jobUrl: job.jobUrl,
            applicationUrl: job.applicationUrl,
            department: job.department,
            team: job.team,
            commitment: job.commitment,
            postedAt: job.postedAt,
            fetchedAt: new Date(),
          },
        });

        // Check if it was created or updated based on createdAt vs updatedAt
        if (
          result.createdAt.getTime() === result.updatedAt.getTime() ||
          new Date().getTime() - result.createdAt.getTime() < 5000
        ) {
          newCount++;
        } else {
          updatedCount++;
        }
      } catch (error: any) {
        this.logger.error(
          `Failed to store job ${job.externalId}: ${error.message}`,
        );
      }
    }

    return { fetched: jobs.length, new: newCount, updated: updatedCount };
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
