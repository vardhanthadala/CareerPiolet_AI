import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CandidatesService } from './candidates.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { ClerkAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/auth.decorator';

@Controller('api/candidates')
@UseGuards(ClerkAuthGuard)
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Post()
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateCandidateDto,
  ) {
    return this.candidatesService.create(userId, dto);
  }

  @Get('me')
  async getMyProfile(@CurrentUser('userId') userId: string) {
    return this.candidatesService.getOrCreate(userId);
  }

  @Put('me')
  async updateMyProfile(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateCandidateDto,
  ) {
    return this.candidatesService.update(userId, dto);
  }

  @Post('resume')
  @UseInterceptors(FileInterceptor('file'))
  async uploadResume(
    @CurrentUser('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No resume file provided');
    }
    return this.candidatesService.uploadResumeFile(userId, file);
  }
}
