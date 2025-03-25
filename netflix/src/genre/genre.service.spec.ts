import { Test, TestingModule } from '@nestjs/testing';
import { GenreService } from './genre.service';
import { Repository } from 'typeorm';
import { Genre } from './entity/genre.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateGenreDto } from './dto/create-genre.dto';
import { NotFoundException } from '@nestjs/common';

const mockGenreRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('GenreService', () => {
  let service: GenreService;
  let repository: Repository<Genre>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenreService,
        {
          provide: getRepositoryToken(Genre),
          useValue: mockGenreRepository,
        },
      ],
    }).compile();

    service = module.get<GenreService>(GenreService);
    repository = module.get<Repository<Genre>>(getRepositoryToken(Genre));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a genre', async () => {
      const createGenreDto: CreateGenreDto = { name: 'Action' };
      const savedGenre = { id: 1, name: 'Action' };

      jest.spyOn(repository, 'save').mockResolvedValue(savedGenre as Genre);

      const result = await service.create(createGenreDto);

      expect(repository.save).toHaveBeenCalledWith(createGenreDto);
      expect(result).toEqual(result);
    });
  });

  describe('findAll', () => {
    it('should return all genres', async () => {
      const genres = [
        { id: 1, name: 'Action' },
        { id: 2, name: 'Drama' },
      ];
      jest.spyOn(repository, 'find').mockResolvedValue(genres as Genre[]);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual(genres);
    });
  });

  describe('findOne', () => {
    it('should return a genre by id', async () => {
      const genre = { id: 1, name: 'Action' };
      jest.spyOn(repository, 'findOne').mockResolvedValue(genre as Genre);

      const result = await service.findOne(genre.id);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: genre.id },
      });
      expect(result).toEqual(genre);
    });

    it('should throw NotFoundException if genre not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a genre', async () => {
      const updateGenreDto = { name: 'Adventure' };
      const existingGenre = { id: 1, name: 'Action' };
      const updatedGenre = { id: 1, name: 'Adventure' };

      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValueOnce(existingGenre as Genre)
        .mockResolvedValueOnce(updatedGenre as Genre);

      const result = await service.update(1, updateGenreDto);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: existingGenre.id },
      });
      expect(repository.update).toHaveBeenCalledWith(
        existingGenre.id,
        updateGenreDto,
      );
      expect(result).toEqual(updatedGenre);
    });

    it('should throw NotFoundException if genre not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.update(1, { name: 'Adventure' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a genre', async () => {
      const genre = { id: 1, name: 'Action' };
      jest.spyOn(repository, 'findOne').mockResolvedValue(genre as Genre);

      const result = await service.remove(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: genre.id },
      });
      expect(repository.delete).toHaveBeenCalledWith(genre.id);
      expect(result).toBe(genre.id);
    });

    it('should throw NotFoundException if genre not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.remove(1)).rejects.toThrow(NotFoundException);
    });
  });
});
