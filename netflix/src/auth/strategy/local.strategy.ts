import { Injectable } from '@nestjs/common';
import { Strategy } from 'passport-local';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { AuthService } from '../auth.service';

export class LocalAuthGuard extends AuthGuard('emailLogin') {}

//default는  local
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'emailLogin') {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email', // default는 username 변경 시 다른걸로 가능
    });
  }

  /**
   * LocalStrategy 에서 사용하는 validate 함수는 기본적으로 username과 password를 파라미터로 받는다.
   *
   * return -> Request();
   */
  async validate(email: string, password: string) {
    const user = await this.authService.authenticate(email, password);
    return user;
  }
}
