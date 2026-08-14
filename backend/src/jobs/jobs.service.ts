import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface SearchJobsParams {
  query?: string;
  location?: string;
  workplaceType?: string;
  department?: string;
  companyId?: string;
  postedWithin?: string;
  page?: number;
  limit?: number;
  sortBy?: 'postedAt' | 'title' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  async search(params: SearchJobsParams) {
    const {
      query,
      location,
      workplaceType,
      department,
      companyId,
      postedWithin,
      page = 1,
      limit = 20,
      sortBy = 'postedAt',
      sortOrder = 'desc',
    } = params;

    const where: Prisma.JobWhereInput = {};

    // Text search on title and description
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { descriptionPlain: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (workplaceType) {
      where.workplaceType = workplaceType as any;
    }

    if (department) {
      where.department = { contains: department, mode: 'insensitive' };
    }

    if (companyId) {
      where.companyId = companyId;
    }

    if (postedWithin && postedWithin !== 'all') {
      const now = new Date();
      let since: Date | null = null;
      if (postedWithin === 'today') {
        since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      } else if (postedWithin === 'week') {
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (postedWithin === 'month') {
        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      if (since) {
        where.postedAt = {
          gte: since,
        };
      }
    }

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        include: {
          company: {
            select: { id: true, name: true, logoUrl: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    return this.prisma.job.findUnique({
      where: { id },
      include: {
        company: true,
      },
    });
  }

  async getStats() {
    const [totalJobs, totalCompanies, sources] = await Promise.all([
      this.prisma.job.count(),
      this.prisma.company.count({ where: { active: true } }),
      this.prisma.job.groupBy({
        by: ['source'],
        _count: true,
      }),
    ]);

    return {
      totalJobs,
      totalCompanies,
      bySource: sources.map((s) => ({
        source: s.source,
        count: s._count,
      })),
    };
  }

  async saveJob(userId: string, jobId: string) {
    const user = await this.prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) throw new Error('User not found');

    return this.prisma.savedJob.upsert({
      where: {
        userId_jobId: { userId: user.id, jobId },
      },
      create: { userId: user.id, jobId },
      update: {},
    });
  }

  async unsaveJob(userId: string, jobId: string) {
    const user = await this.prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) throw new Error('User not found');

    return this.prisma.savedJob.delete({
      where: {
        userId_jobId: { userId: user.id, jobId },
      },
    });
  }

  async getSavedJobs(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return [];

    return this.prisma.savedJob.findMany({
      where: { userId: user.id },
      include: {
        job: {
          include: {
            company: { select: { id: true, name: true, logoUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyApplications(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return [];

    return this.prisma.application.findMany({
      where: { userId: user.id },
      select: {
        jobId: true,
        status: true,
        appliedAt: true,
      },
    });
  }

  async updateApplicationStatus(userId: string, jobId: string, status: string) {
    const user = await this.prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) throw new Error('User not found');

    // Ensure candidate profile exists (required for Application relation)
    let candidate = await this.prisma.candidateProfile.findUnique({
      where: { userId: user.id },
    });
    if (!candidate) {
      candidate = await this.prisma.candidateProfile.create({
        data: { userId: user.id },
      });
    }

    return this.prisma.application.upsert({
      where: { candidateId_jobId: { candidateId: candidate.id, jobId } },
      create: {
        userId: user.id,
        candidateId: candidate.id,
        jobId,
        status: status as any,
        appliedAt: status === 'APPLIED' ? new Date() : null,
      },
      update: {
        status: status as any,
        appliedAt: status === 'APPLIED' ? new Date() : undefined,
      },
    });
  }
}
