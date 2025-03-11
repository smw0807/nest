import { Test, TestingModule } from '@nestjs/testing';
import { DirectorController } from './director.controller';
import { DirectorService } from './director.service';
import { Director } from './entity/director.entity';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';

const mockDirectorService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};
describe('DirectorController', () => {
  let directorController: DirectorController;
  let directorService: DirectorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DirectorController],
      providers: [
        DirectorService,
        {
          provide: DirectorService,
          useValue: mockDirectorService,
        },
      ],
    }).compile();
    directorController = module.get<DirectorController>(DirectorController);
    directorService = module.get<DirectorService>(DirectorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(directorController).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of directors', async () => {
      const directors = [{ id: 1, name: 'John Doe' }];

      jest
        .spyOn(mockDirectorService, 'findAll')
        .mockResolvedValue(directors as Director[]);

      expect(directorController.findAll()).resolves.toEqual(directors);
      expect(directorService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single director', () => {
      const director = { id: 1, name: 'John Doe' };

      jest.spyOn(mockDirectorService, 'findOne').mockResolvedValue(director);

      expect(directorController.findOne(1)).resolves.toEqual(director);
      expect(directorService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    it('should create a new director', () => {
      const createDirectorDto = { name: 'John Doe' };
      const result = { id: 1, name: 'John Doe' };

      jest.spyOn(mockDirectorService, 'create').mockResolvedValue(result);

      expect(
        directorController.create(createDirectorDto as CreateDirectorDto),
      ).resolves.toEqual(result);
      expect(directorService.create).toHaveBeenCalledWith(createDirectorDto);
    });
  });

  describe('update', () => {
    it('should update a director', () => {
      const updateDirectorDto = { name: 'John Doe' };
      const result = { id: 1, name: 'John Doe' };

      jest.spyOn(mockDirectorService, 'update').mockResolvedValue(result);

      expect(
        directorController.update(1, updateDirectorDto as UpdateDirectorDto),
      ).resolves.toEqual(result);
      expect(directorService.update).toHaveBeenCalledWith(1, updateDirectorDto);
    });
  });

  describe('remove', () => {
    it('should remove a director', () => {
      const result = 1;

      jest.spyOn(mockDirectorService, 'remove').mockResolvedValue(result);

      expect(directorController.remove(1)).resolves.toEqual(result);
      expect(directorService.remove).toHaveBeenCalledWith(1);
    });
  });
});
