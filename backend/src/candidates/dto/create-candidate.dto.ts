import { IsString, IsOptional, IsArray, IsEnum, IsInt, Min } from 'class-validator';

enum ExperienceLevel {
  INTERN = 'INTERN',
  ENTRY = 'ENTRY',
  MID = 'MID',
  SENIOR = 'SENIOR',
  LEAD = 'LEAD',
  MANAGER = 'MANAGER',
  DIRECTOR = 'DIRECTOR',
  EXECUTIVE = 'EXECUTIVE',
}

enum RemotePreference {
  ONSITE = 'ONSITE',
  REMOTE = 'REMOTE',
  HYBRID = 'HYBRID',
  FLEXIBLE = 'FLEXIBLE',
}

export class CreateCandidateDto {
  @IsOptional()
  @IsString()
  headline?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetRoles?: string[];

  @IsOptional()
  @IsEnum(ExperienceLevel)
  experienceLevel?: ExperienceLevel;

  @IsOptional()
  @IsInt()
  @Min(0)
  yearsOfExp?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredLocations?: string[];

  @IsOptional()
  @IsEnum(RemotePreference)
  remotePreference?: RemotePreference;

  @IsOptional()
  @IsInt()
  @Min(0)
  salaryExpMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  salaryExpMax?: number;

  @IsOptional()
  @IsString()
  salaryCurrency?: string;

  @IsOptional()
  @IsString()
  noticePeriod?: string;

  @IsOptional()
  @IsString()
  workAuthorization?: string;

  @IsOptional()
  education?: any;

  @IsOptional()
  experience?: any;

  @IsOptional()
  projects?: any;

  @IsOptional()
  certifications?: any;
}
