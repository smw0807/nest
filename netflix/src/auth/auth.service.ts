import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  parseBasicToken(rawToken: string) {
    const basicSplit = rawToken.split(' ');
    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못됐습니다.!');
    }
    const [basic, token] = basicSplit;
    if (basic.toLocaleLowerCase() !== 'basic') {
      throw new BadRequestException('토큰 포맷이 잘못됐습니다.!');
    }
    // 추출한 토큰을 base64 디코딩해서 이메일과 비밀번호로 나눈다.
    const decoded = Buffer.from(token, 'base64').toString('utf-8');

    // email:password
    const tokenSplit = decoded.split(':');
    if (tokenSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못됐습니다.!');
    }
    const [email, password] = tokenSplit;
    return { email, password };
  }

  async parseBearerToken(rawToken: string, isRefreshToken: boolean) {
    const bearerSplit = rawToken.split(' ');
    if (bearerSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못됐습니다.!');
    }
    const [bearer, token] = bearerSplit;
    if (bearer.toLocaleLowerCase() !== 'bearer') {
      throw new BadRequestException('토큰 포맷이 잘못됐습니다.!');
    }

    const payload = await this.jwtService.verifyAsync(token, {
      secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
    });
    if (isRefreshToken) {
      if (payload.type !== 'refresh') {
        throw new BadRequestException('리프레시 토큰이 아닙니다.!');
      }
    } else {
      if (payload.type !== 'access') {
        throw new BadRequestException('엑세스 토큰이 아닙니다.!');
      }
    }
    return payload;
  }

  // rawToken -> "Basic $token"
  async register(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);

    const user = await this.userRepository.findOne({
      where: {
        email,
      },
    });

    if (user) {
      throw new BadRequestException('이미 가입된 이메일입니다.!');
    }

    const hashedPassword = await bcrypt.hash(
      password,
      this.configService.get<number>('HASH_ROUNDS'),
    );
    await this.userRepository.save({
      email,
      password: hashedPassword,
    });
    return this.userRepository.findOne({
      where: {
        email,
      },
    });
  }

  async authenticate(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: {
        email,
      },
    });

    if (!user) {
      throw new BadRequestException('잘못된 로그인 정보입니다!');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('잘못된 로그인 정보입니다!');
    }
    return user;
  }

  async issueToken(
    user: { id: number; role: number },
    isRefreshToken: boolean,
  ) {
    const refreshTokenSecret = this.configService.get<string>(
      'REFRESH_TOKEN_SECRET',
    );
    const accessTokenSecret = this.configService.get<string>(
      'ACCESS_TOKEN_SECRET',
    );
    return await this.jwtService.signAsync(
      {
        sub: user.id,
        role: user.role,
        type: isRefreshToken ? 'refresh' : 'access',
      },
      {
        secret: isRefreshToken ? refreshTokenSecret : accessTokenSecret,
        expiresIn: isRefreshToken ? '24h' : 300,
      },
    );
  }

  async login(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);

    const user = await this.authenticate(email, password);

    return {
      refreshToken: await this.issueToken(user, true),
      accessToken: await this.issueToken(user, false),
    };
  }
}
