import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';

const mockUserRepository = {
  findOne: jest.fn(),
};
const mockConfigService = {
  get: jest.fn(),
};
const mockJwtService = {
  signAsync: jest.fn(),
  verifyAsync: jest.fn(),
  decode: jest.fn(),
};
const mockCacheManager = {
  set: jest.fn(),
};
const mockUserService = {
  create: jest.fn(),
};

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: Repository<User>;
  let configService: ConfigService;
  let jwtService: JwtService;
  let cacheManager: Cache;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    configService = module.get<ConfigService>(ConfigService);
    jwtService = module.get<JwtService>(JwtService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('blockToken', () => {
    it('should block a token', async () => {
      const token = 'token';
      const payload = {
        exp: Math.floor(Date.now() / 1000) + 60,
      };

      jest.spyOn(jwtService, 'decode').mockReturnValue(payload);
      await authService.blockToken(token);

      expect(jwtService.decode).toHaveBeenCalledWith(token);
      expect(cacheManager.set).toHaveBeenCalledWith(
        `BLOCK_TOKEN_${token}`,
        payload,
        expect.any(Number),
      );
    });
  });

  describe('parseBasicToken', () => {
    it('should parse a valid basic token', () => {
      const rawToken = 'Basic c213QGdtYWlsLmNvbToxMjMxMjM=';
      const result = authService.parseBasicToken(rawToken);

      const decode = {
        email: 'smw@gmail.com',
        password: '123123',
      };

      expect(result).toEqual(decode);
    });

    it('should throw an error for split length', () => {
      const rawToken = 'Basica';
      expect(() => authService.parseBasicToken(rawToken)).toThrow(
        BadRequestException,
      );
    });

    it('should throw an error for invalid format', () => {
      const rawToken = 'Basic InvalidFormat';
      expect(() => authService.parseBasicToken(rawToken)).toThrow(
        BadRequestException,
      );
    });

    it('should throw an error for invalid basic token format', () => {
      const rawToken = 'Bearer InvalidFormat';
      expect(() => authService.parseBasicToken(rawToken)).toThrow(
        BadRequestException,
      );
    });

    it('should throw an error for invalid basic token format', () => {
      const rawToken = 'Bearer a';
      expect(() => authService.parseBasicToken(rawToken)).toThrow(
        BadRequestException,
      );
    });
  });
});
