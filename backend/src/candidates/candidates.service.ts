import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { S3StorageService } from './s3-storage.service';

@Injectable()
export class CandidatesService {
  constructor(
    private prisma: PrismaService,
    private s3Storage: S3StorageService,
  ) {}

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

  /**
   * Uploads resume to AWS S3 and records the S3 URL in candidate_profiles.resumeUrl
   */
  async uploadResumeFile(clerkId: string, file: Express.Multer.File) {
    const candidate = await this.getOrCreate(clerkId);

    // 1. Upload to AWS S3
    const { url } = await this.s3Storage.uploadResume(candidate.userId, file);

    // 2. Persist in Database
    const updated = await this.prisma.candidateProfile.update({
      where: { id: candidate.id },
      data: {
        resumeUrl: url,
        resumeParsedAt: new Date(),
      },
    });

    return {
      success: true,
      resumeUrl: updated.resumeUrl,
      resumeParsedAt: updated.resumeParsedAt,
    };
  }
}
