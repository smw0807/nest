import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

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

  describe('parseBearerToken', () => {
    it('should parse a valid Bearer token', async () => {
      const rawToken = 'Bearer token';
      const payload = {
        type: 'access',
      };
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);
      jest.spyOn(mockConfigService, 'get').mockReturnValue('secret');

      const result = await authService.parseBearerToken(rawToken, false);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('token', {
        secret: 'secret',
      });
      expect(result).toEqual(payload);
    });

    it('should throw an BadRequestException for invalid token', async () => {
      const rawToken = 'a';
      expect(authService.parseBearerToken(rawToken, false)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw an BadRequestException for token not starting with Bearer', async () => {
      const rawToken = 'Basic a';
      expect(authService.parseBearerToken(rawToken, false)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw an BadRequestException if payload.type is not refresh but isRefreshToken parameter is true', async () => {
      const rawToken = 'Bearer token';
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({
        type: 'refresh',
      });
      expect(authService.parseBearerToken(rawToken, false)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw an BadRequestException if payload.type is not refresh but isRefreshToken parameter is true', async () => {
      const rawToken = 'Bearer token';
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({
        type: 'access',
      });
      expect(authService.parseBearerToken(rawToken, true)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('register', () => {
    it('should register a user', async () => {
      const rawToken = 'Basic c213QGdtYWlsLmNvbToxMjMxMjM=';
      const user = {
        email: 'smw@gmail.com',
        password: '123123',
      };
      jest.spyOn(authService, 'parseBasicToken').mockReturnValue(user);
      jest.spyOn(mockUserService, 'create').mockResolvedValue(user as User);

      const result = await authService.register(rawToken);

      expect(authService.parseBasicToken).toHaveBeenCalledWith(rawToken);
      expect(userService.create).toHaveBeenCalledWith(user);
      expect(result).toEqual(user);
    });
  });

  describe('authenticate', () => {
    it('should authenticate a user with correct credentials', async () => {
      const email = 'smw@gmail.com';
      const password = '123123';
      const user = {
        email,
        password,
      };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user as User);
      jest.spyOn(bcrypt, 'compare').mockImplementation((a, b) => true);

      const result = await authService.authenticate(email, password);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: {
          email,
        },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, user.password);
      expect(result).toEqual(user);
    });

    it('should throw an error for not existing user', async () => {
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

      expect(
        authService.authenticate('smw@gmail.com', '123123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw an error for incorrect password', async () => {
      const user = {
        email: 'smw@gmail.com',
        password: '123123',
      };
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(user as User);
      jest.spyOn(bcrypt, 'compare').mockImplementation((a, b) => false);

      await expect(
        authService.authenticate(user.email, user.password),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('issueToken', () => {
    const user = {
      id: 1,
      role: 1,
    };
    const token = 'token';
    beforeEach(() => {
      jest.spyOn(configService, 'get').mockReturnValue('secret');
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue(token);
    });
    it('should issue an access token', async () => {
      const result = await authService.issueToken(user as User, false);

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: user.id,
          type: 'access',
          role: user.role,
        },
        {
          secret: 'secret',
          expiresIn: '5m',
        },
      );
      expect(result).toBe(token);
    });

    it('should issue an refresh token', async () => {
      const result = await authService.issueToken(user as User, true);

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: user.id,
          type: 'refresh',
          role: user.role,
        },
        {
          secret: 'secret',
          expiresIn: '24h',
        },
      );
      expect(result).toBe(token);
    });
  });

  describe('login', () => {
    it('should login a user and return tokens', async () => {
      const rawToken = 'Basic c213QGdtYWlsLmNvbToxMjMxMjM=';
      const email = 'smw@gmail.com';
      const password = '123123';
      const user = {
        email,
        password,
      };
      jest.spyOn(authService, 'parseBasicToken').mockReturnValue(user);
      jest.spyOn(authService, 'authenticate').mockResolvedValue(user as User);
      jest.spyOn(authService, 'issueToken').mockResolvedValue('token');

      const result = await authService.login(rawToken);

      expect(authService.parseBasicToken).toHaveBeenCalledWith(rawToken);
      expect(authService.authenticate).toHaveBeenCalledWith(email, password);
      expect(authService.issueToken).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        accessToken: 'token',
        refreshToken: 'token',
      });
    });
  });
});
