import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3StorageService {
  private readonly logger = new Logger(S3StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;

  constructor(private configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION', 'eu-north-1');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME', 'client-login-portal-assets');

    if (accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.logger.log(`Initialized S3 client for region: ${this.region}, bucket: ${this.bucketName}`);
    } else {
      this.logger.warn('AWS credentials not found. S3 storage will be disabled.');
    }
  }

  /**
   * Uploads a resume file buffer to AWS S3 and returns the public / accessible URL.
   */
  async uploadResume(userId: string, file: Express.Multer.File): Promise<{ url: string; key: string }> {
    if (!this.s3Client) {
      throw new Error('AWS S3 client is not configured');
    }

    const timestamp = Date.now();
    const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `resumes/${userId}/${timestamp}_${sanitizedFileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype || 'application/octet-stream',
    });

    await this.s3Client.send(command);
    this.logger.log(`Successfully uploaded resume to S3: ${key}`);

    // Direct S3 URL
    const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;

    return { url, key };
  }

  /**
   * Generates a pre-signed URL to view / download private S3 objects (expires in 24 hours).
   */
  async getSignedResumeUrl(key: string, expiresIn: number = 86400): Promise<string> {
    if (!this.s3Client) {
      throw new Error('AWS S3 client is not configured');
    }

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }
}
