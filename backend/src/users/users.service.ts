import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOrCreateByClerkId(clerkId: string, data?: { email?: string; firstName?: string; lastName?: string; avatarUrl?: string }) {
    const existing = await this.prisma.user.findUnique({
      where: { clerkId },
      include: { candidate: true },
    });

    if (existing) return existing;

    return this.prisma.user.create({
      data: {
        clerkId,
        email: data?.email || `${clerkId}@placeholder.com`,
        firstName: data?.firstName,
        lastName: data?.lastName,
        avatarUrl: data?.avatarUrl,
      },
      include: { candidate: true },
    });
  }

  async findByClerkId(clerkId: string) {
    return this.prisma.user.findUnique({
      where: { clerkId },
      include: { candidate: true },
    });
  }

  async updateUser(clerkId: string, data: { email?: string; firstName?: string; lastName?: string; avatarUrl?: string }) {
    return this.prisma.user.update({
      where: { clerkId },
      data,
    });
  }
}
