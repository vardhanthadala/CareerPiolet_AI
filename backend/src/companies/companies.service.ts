import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AtsType } from '@prisma/client';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.company.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { jobs: true } },
      },
    });
  }

  async findActive() {
    return this.prisma.company.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: { _count: { select: { jobs: true } } },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async create(data: {
    name: string;
    atsType: AtsType;
    atsIdentifier: string;
    careersUrl?: string;
    logoUrl?: string;
    description?: string;
  }) {
    return this.prisma.company.create({ data });
  }

  async updateLastFetched(id: string) {
    return this.prisma.company.update({
      where: { id },
      data: { lastFetchedAt: new Date() },
    });
  }

  async seedDefaults() {
    const defaults = [
      { name: 'Stripe', atsType: AtsType.GREENHOUSE, atsIdentifier: 'stripe' },
      { name: 'Airbnb', atsType: AtsType.GREENHOUSE, atsIdentifier: 'airbnb' },
      { name: 'Cloudflare', atsType: AtsType.GREENHOUSE, atsIdentifier: 'cloudflare' },
      { name: 'Twitch', atsType: AtsType.GREENHOUSE, atsIdentifier: 'twitch' },
      { name: 'Netflix', atsType: AtsType.GREENHOUSE, atsIdentifier: 'netflix' },
      { name: 'Figma', atsType: AtsType.LEVER, atsIdentifier: 'figma' },
      { name: 'Notion', atsType: AtsType.LEVER, atsIdentifier: 'notion' },
      { name: 'Palantir', atsType: AtsType.LEVER, atsIdentifier: 'palantir' },
      { name: 'Ramp', atsType: AtsType.ASHBY, atsIdentifier: 'ramp' },
      { name: 'Linear', atsType: AtsType.ASHBY, atsIdentifier: 'linear' },
    ];

    const results = [];
    for (const company of defaults) {
      const existing = await this.prisma.company.findUnique({
        where: {
          atsType_atsIdentifier: {
            atsType: company.atsType,
            atsIdentifier: company.atsIdentifier,
          },
        },
      });

      if (!existing) {
        const created = await this.prisma.company.create({ data: company });
        results.push(created);
      } else {
        results.push(existing);
      }
    }

    return results;
  }
}
