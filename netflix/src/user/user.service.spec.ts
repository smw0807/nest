import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { NotFoundException } from '@nestjs/common';

// 데이터베이스 작업을 흉대내는 가짜 저장소
const mockUserRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
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
      ],
    }).compile();

    // 테스트가 시작되기 전에 새로운 UserService 인스턴스를 생성
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
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
});
