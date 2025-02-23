import {
  BadRequestException,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
import { envVariableKeys } from 'src/common/constants/env.const';

@Injectable()
export class BearerTokenMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      next();
      return;
    }

    try {
      const token = this.validateBearerToken(authHeader);
      const decodedPayload = await this.jwtService.decode(token);

      if (
        decodedPayload.type !== 'refresh' &&
        decodedPayload.type !== 'access'
      ) {
        throw new UnauthorizedException('토큰 타입이 잘못됐습니다.!');
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(
          decodedPayload.type === 'refresh'
            ? envVariableKeys.refreshTokenSecret
            : envVariableKeys.accessTokenSecret,
        ),
      });
      req.user = payload;

      next();
    } catch (e) {
      next();
      // throw new UnauthorizedException('토큰이 만료됐습니다.!');
    }
  }

  validateBearerToken(rawToken: string) {
    const bearerSplit = rawToken.split(' ');
    if (bearerSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못됐습니다.!');
    }

    const [bearer, token] = bearerSplit;
    if (bearer.toLocaleLowerCase() !== 'bearer') {
      throw new BadRequestException('토큰 포맷이 잘못됐습니다.!');
    }
    return token;
  }
}
