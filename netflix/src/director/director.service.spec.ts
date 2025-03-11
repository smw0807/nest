import { Test, TestingModule } from '@nestjs/testing';
import { DirectorService } from './director.service';
import { Director } from './entity/director.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDirectorDto } from './dto/create-director.dto';
import { NotFoundException } from '@nestjs/common';

const mockDirectorRepository = {
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('DirectorService', () => {
  let directorService: DirectorService;
  let directorRepository: Repository<Director>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DirectorService,
        {
          provide: getRepositoryToken(Director),
          useValue: mockDirectorRepository,
        },
      ],
    }).compile();

    directorService = module.get<DirectorService>(DirectorService);
    directorRepository = module.get<Repository<Director>>(
      getRepositoryToken(Director),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(directorService).toBeDefined();
  });

  describe('create', () => {
    it('should create a new director', async () => {
      const createDirectorDto = {
        name: 'John Doe',
        dob: new Date('1990-01-01'),
        nationality: 'USA',
      };
      jest
        .spyOn(mockDirectorRepository, 'save')
        .mockResolvedValue(createDirectorDto);

      const result = await directorService.create(
        createDirectorDto as CreateDirectorDto,
      );

      expect(directorRepository.save).toHaveBeenCalledWith(createDirectorDto);
      expect(result).toEqual(createDirectorDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of directors', async () => {
      const directors = [
        {
          id: 1,
          name: 'John Doe',
          dob: new Date('1990-01-01'),
          nationality: 'USA',
        },
      ];
      jest.spyOn(mockDirectorRepository, 'find').mockResolvedValue(directors);

      const result = await directorService.findAll();

      expect(directorRepository.find).toHaveBeenCalled();
      expect(result).toEqual(directors);
    });
  });

  describe('findOne', () => {
    it('should return a single director by id', async () => {
      const director = {
        id: 1,
        name: 'John Doe',
      };
      jest.spyOn(mockDirectorRepository, 'findOne').mockResolvedValue(director);

      const result = await directorService.findOne(director.id);

      expect(directorRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(director);
    });
  });

  describe('update', () => {
    it('should update a director by id', async () => {
      const updateDirectorDto = {
        name: 'John Doe',
      };
      const existingDirector = {
        id: 1,
        name: 'Jane Smith',
      };
      const updatedDirector = {
        id: 1,
        name: 'John Doe',
      };
      jest
        .spyOn(mockDirectorRepository, 'findOne')
        .mockResolvedValueOnce(existingDirector);
      jest
        .spyOn(mockDirectorRepository, 'update')
        .mockResolvedValueOnce(updatedDirector);

      const result = await directorService.update(1, updateDirectorDto);

      expect(directorRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(directorRepository.update).toHaveBeenCalledWith(
        1,
        updateDirectorDto,
      );
      expect(result).toEqual(updatedDirector);
    });

    it('should throw NotFoundException if director is not found', async () => {
      jest.spyOn(mockDirectorRepository, 'findOne').mockResolvedValue(null);
      expect(directorService.update(1, { name: 'John Doe' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a director by id', async () => {
      const id = 1;
      jest.spyOn(mockDirectorRepository, 'findOne').mockResolvedValue(id);
      jest.spyOn(mockDirectorRepository, 'delete').mockResolvedValue(id);

      const result = await directorService.remove(id);

      expect(directorRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(directorRepository.delete).toHaveBeenCalledWith(id);
      expect(result).toEqual(id);
    });

    it('should throw NotFoundException if director is not found', async () => {
      jest.spyOn(mockDirectorRepository, 'findOne').mockResolvedValue(null);
      expect(directorService.remove(1)).rejects.toThrow(NotFoundException);
    });
  });
});
