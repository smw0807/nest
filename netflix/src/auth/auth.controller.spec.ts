import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from 'src/user/entities/user.entity';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  issueToken: jest.fn(),
  blockToken: jest.fn(),
};
describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();
    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', async () => {
    expect(authController).toBeDefined();
  });

  describe('registerUser', () => {
    it('should register a user', () => {
      const token = 'Basic dXNlcm5hbWU6cGFzc3dvcmQ=';
      const result = { id: 1, email: 'smw@gmail.com' };

      jest.spyOn(authService, 'register').mockResolvedValue(result as User);

      expect(authController.registerUser(token)).resolves.toEqual(result);
      expect(authService.register).toHaveBeenCalledWith(token);
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      const token = 'Basic dXNlcm5hbWU6cGFzc3dvcmQ=';
      const result = {
        refreshToken: 'refreshToken',
        accessToken: 'accessToken',
      };

      jest.spyOn(authService, 'login').mockResolvedValue(result);

      expect(authController.loginUser(token)).resolves.toEqual(result);
      expect(authService.login).toHaveBeenCalledWith(token);
    });
  });

  describe('blockToken', () => {
    it('should block a token', () => {
      const token = 'some.jwt.token';
      jest.spyOn(authService, 'blockToken').mockResolvedValue(true);
      expect(authController.blockToken(token)).resolves.toEqual(true);
      expect(authService.blockToken).toHaveBeenCalledWith(token);
    });
  });

  describe('lotateAccessToken', () => {
    it('should rotate access token', async () => {
      const accessToken = 'mocked.access.token';

      jest.spyOn(authService, 'issueToken').mockResolvedValue(accessToken);

      const result = await authController.rotateAccessToken({ user: 'a' });
      expect(authService.issueToken).toHaveBeenCalledWith('a', false);
      expect(result).toEqual({ accessToken });
    });
  });

  describe('loginUserPassport', () => {
    it('should login user using passport strategy', async () => {
      const user = { id: 1, email: 'smw@gmail.com' };
      const req = { user };
      const accessToken = 'mocked.access.token';
      const refreshToken = 'mocked.refresh.token';

      jest
        .spyOn(authService, 'issueToken')
        .mockResolvedValueOnce(refreshToken)
        .mockResolvedValueOnce(accessToken);

      const result = await authController.loginUserPassport(req);
      expect(authService.issueToken).toHaveBeenCalledTimes(2);
      expect(authService.issueToken).toHaveBeenNthCalledWith(1, user, true);
      expect(authService.issueToken).toHaveBeenNthCalledWith(2, user, false);
      expect(result).toEqual({
        accessToken,
        refreshToken,
      });
    });
  });
});
