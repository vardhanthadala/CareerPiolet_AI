import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';

@Injectable()
export class CandidatesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateCandidateDto) {
    // First ensure user exists
    const user = await this.prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.candidateProfile.create({
      data: {
        userId: user.id,
        ...dto,
      },
    });
  }

  async findByUserId(clerkId: string) {
    const user = await this.prisma.user.findUnique({ where: { clerkId } });
    if (!user) throw new NotFoundException('User not found');

    const candidate = await this.prisma.candidateProfile.findUnique({
      where: { userId: user.id },
    });

    return candidate;
  }

  async update(clerkId: string, dto: UpdateCandidateDto) {
    const user = await this.prisma.user.findUnique({ where: { clerkId } });
    if (!user) throw new NotFoundException('User not found');

    const candidate = await this.prisma.candidateProfile.findUnique({
      where: { userId: user.id },
    });

    if (!candidate) throw new NotFoundException('Candidate profile not found');

    return this.prisma.candidateProfile.update({
      where: { id: candidate.id },
      data: dto,
    });
  }

  async getOrCreate(clerkId: string) {
    const user = await this.prisma.user.findUnique({ where: { clerkId } });
    if (!user) throw new NotFoundException('User not found');

    let candidate = await this.prisma.candidateProfile.findUnique({
      where: { userId: user.id },
    });

    if (!candidate) {
      candidate = await this.prisma.candidateProfile.create({
        data: { userId: user.id },
      });
    }

    return candidate;
  }
}
