import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Cache } from 'cache-manager';
import { Request, Response, NextFunction } from 'express';
import { envVariableKeys } from 'src/common/constants/env.const';

@Injectable()
export class BearerTokenMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      next();
      return;
    }

    try {
      const token = this.validateBearerToken(authHeader);

      const tokenKey = `TOKEN_${token}`;
      const cachePayload = await this.cacheManager.get(tokenKey);
      if (cachePayload) {
        console.log('cachePayload 사용!');
        req.user = cachePayload;
        return next();
      }

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

      // payload['exp'] 토큰 만료 시간
      const expiryDate = +new Date(payload['exp'] * 1000);
      const now = +Date.now();
      const differenceIsSecondes = (expiryDate - now) / 1000;
      await this.cacheManager.set(
        tokenKey,
        payload,
        Math.max((differenceIsSecondes - 30) * 1000, 1),
      );

      req.user = payload;

      next();
    } catch (e) {
      if (e.name === 'TokenExpiredError') {
        throw new UnauthorizedException('토큰이 만료됐습니다.!');
      }
      next();
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
