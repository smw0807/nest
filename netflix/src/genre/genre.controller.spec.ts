import { Test, TestingModule } from '@nestjs/testing';
import { GenreController } from './genre.controller';
import { GenreService } from './genre.service';
import { Genre } from './entities/genre.entity';

const mockService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};
describe('GenreController', () => {
  let controller: GenreController;
  let service: GenreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GenreController],
      providers: [
        {
          provide: GenreService,
          useValue: mockService,
        },
      ],
    }).compile();
    controller = module.get<GenreController>(GenreController);
    service = module.get<GenreService>(GenreService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a genre', async () => {
      const createGenreDto = {
        name: 'Action',
      };
      const result = {
        id: 1,
        ...createGenreDto,
      };

      jest.spyOn(service, 'create').mockResolvedValue(result as Genre);

      expect(controller.create(createGenreDto)).resolves.toEqual(result);
      expect(service.create).toHaveBeenCalledWith(createGenreDto);
    });
  });

  describe('findAll', () => {
    it('should return all genres', async () => {
      const result = [
        { id: 1, name: 'Action' },
        { id: 2, name: 'Adventure' },
      ];

      jest.spyOn(service, 'findAll').mockResolvedValue(result as Genre[]);

      expect(controller.findAll()).resolves.toEqual(result);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a genre by id', async () => {
      const result = { id: 1, name: 'Action' };

      jest.spyOn(service, 'findOne').mockResolvedValue(result as Genre);

      expect(controller.findOne(1)).resolves.toEqual(result);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a genre', async () => {
      const id = 1;
      const updateGenreDto = {
        name: 'Adventure',
      };
      const result = {
        id: 1,
        ...updateGenreDto,
      };

      jest.spyOn(service, 'update').mockResolvedValue(result as Genre);

      expect(controller.update(id, updateGenreDto)).resolves.toEqual(result);
      expect(service.update).toHaveBeenCalledWith(id, updateGenreDto);
    });
  });

  describe('remove', () => {
    it('should remove a genre', async () => {
      const id = 1;
      jest.spyOn(service, 'remove').mockResolvedValue(id);

      expect(controller.remove(id)).resolves.toBe(id);
      expect(service.remove).toHaveBeenCalledWith(id);
    });
  });
});
