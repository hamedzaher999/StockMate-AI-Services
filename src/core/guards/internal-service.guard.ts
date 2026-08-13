import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

const INTERNAL_SECRET_HEADER = 'x-internal-secret';

@Injectable()
export class InternalServiceGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.headers[INTERNAL_SECRET_HEADER];
    const expected = this.configService.get<string>('security.internalSecret');

    if (
      !expected ||
      typeof provided !== 'string' ||
      provided.length === 0 ||
      provided !== expected
    ) {
      throw new UnauthorizedException(
        'This service only accepts requests from the main backend.',
      );
    }

    return true;
  }
}
