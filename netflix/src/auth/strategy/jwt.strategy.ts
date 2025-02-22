import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthGuard } from '@nestjs/passport';
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      // 어디에서 토큰을 추출할지 지정 - 헤더에서 토큰을 추출
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // 토큰이 만료되었는지 확인
      ignoreExpiration: false,
      // 토큰 검증 시 사용할 비밀키
      secretOrKey: configService.get<string>('ACCESS_TOKEN_SECRET'),
    });
  }

  /**
   * 토큰 검증 시 사용되는 함수
   *
   * @param payload
   * @returns
   */
  validate(payload: any) {
    return payload;
  }
}
