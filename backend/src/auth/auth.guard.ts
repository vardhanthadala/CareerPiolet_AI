import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    // Default demo user identity when auth is bypassed
    request.auth = {
      userId: 'demo-user-id',
      sessionId: 'demo-session-id',
    };
    return true;
  }
}
