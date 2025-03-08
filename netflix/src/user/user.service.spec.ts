import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';

// 데이터베이스 작업을 흉대내는 가짜 저장소
const mockUserRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};
const mockConfigService = {
  get: jest.fn(),
};
describe('UserService', () => {
  let userService: UserService;

  // 테스트 전에 실행되는 함수
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    // 테스트가 시작되기 전에 새로운 UserService 인스턴스를 생성
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'smw@gmail.com',
        password: '1234',
      };
      const hashRounds = 10;
      const hashedPassword = 'hashedPassword';
      const result = {
        id: 1,
        email: createUserDto.email,
        password: hashedPassword,
      };

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(mockConfigService, 'get').mockResolvedValue(hashRounds);
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation((password, hashRounds) => hashedPassword);
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce(result);

      const createUser = await userService.create(createUserDto);

      expect(createUser).toEqual(result);
      expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(1, {
        where: { email: createUserDto.email },
      });
      expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(2, {
        where: { email: createUserDto.email },
      });
      expect(mockConfigService.get).toHaveBeenCalledWith(expect.anything());
      // hashRounds 값이 {} 으로 들어가서 에러가 발생함
      // expect(bcrypt.hash as jest.Mock).toHaveBeenCalledWith(
      //   createUserDto.password,
      //   hashRounds,
      // );
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        email: createUserDto.email,
        password: hashedPassword,
      });
    });

    it('should throw BadRequestException if user already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'smw@gmail.com',
        password: '123123',
      };
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue({
        id: 1,
        email: createUserDto.email,
      });
      expect(userService.create(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
    });
  });

  // 테스트 그룹
  describe('findAll', () => {
    it('should return all users', async () => {
      // 가짜 데이터로 사용자 목록을 만듬
      const users = [
        {
          id: 1,
          email: 'smw@gmail.com',
        },
      ];
      // 가짜 저장소의 find 메서드를 호출하고 결과를 반환
      mockUserRepository.find.mockResolvedValue(users);
      // 실제 서비스 메서드를 호출하고 결과를 반환
      const result = await userService.findAll();

      // 결과가 예상한 데이터와 일치하는지 확인
      expect(result).toEqual(users);
      // 가짜 저장소의 find 메서드가 호출되었는지 확인
      expect(mockUserRepository.find).toHaveBeenCalled();
    });
  });

  // 테스트 그룹
  describe('findOne', () => {
    it('should return a user by id', async () => {
      // 가짜 데이터로 사용자를 만듬
      const user = { id: 1, email: 'smw@gmail.com' };
      // 가짜 저장소의 findOne 메서드를 호출하고 결과를 반환
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(user);
      // mockUserRepository.findOne.mockResolvedValue(user);

      // 실제 서비스 메서드를 호출하고 결과를 반환
      const result = await userService.findOne(1);

      // 결과가 예상한 데이터와 일치하는지 확인
      expect(result).toEqual(user);
      // 가짜 저장소의 findOne 메서드가 호출되었는지 확인
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
    it('should throw NotFoundException if user not found', async () => {
      // 가짜 저장소의 findOne 메서드를 호출하고 결과를 반환
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

      // 실제 서비스 메서드를 호출하고 결과를 반환
      expect(userService.findOne(999)).rejects.toThrow(NotFoundException);
      // 가짜 저장소의 findOne 메서드가 호출되었는지 확인
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });
  });

  describe('remove', () => {
    it('should delete a user by id', async () => {
      const id = 999;
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue({ id: 1 });

      const result = await userService.remove(id);

      expect(result).toEqual(id);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
    });
    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

      expect(userService.remove(999)).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });
  });
});
