import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
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
}
