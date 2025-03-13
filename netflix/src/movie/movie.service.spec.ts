import { Test, TestingModule } from '@nestjs/testing';
import { MovieService } from './movie.service';
import { TestBed } from '@automock/jest';
import { CommonService } from 'src/common/common.service';
import { Movie } from './entity/movie.entity';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';
import { Cache } from 'cache-manager';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Genre } from 'src/genre/entities/genre.entity';
import { User } from 'src/user/entities/user.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';

describe('MovieService', () => {
  let movieService: MovieService;
  let movieRepository: jest.Mocked<Repository<Movie>>;
  let movieDetailRepository: jest.Mocked<Repository<MovieDetail>>;
  let directorRepository: jest.Mocked<Repository<Director>>;
  let genreRepository: jest.Mocked<Repository<Genre>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let movieUserLikeRepository: jest.Mocked<Repository<MovieUserLike>>;
  let dataSource: jest.Mocked<DataSource>;
  let commonService: jest.Mocked<CommonService>;
  let cacheManager: jest.Mocked<Cache>;

  beforeEach(async () => {
    const { unit, unitRef } = await TestBed.create(MovieService).compile();

    movieService = unit;
    movieRepository = unitRef.get(getRepositoryToken(Movie) as string);
    movieDetailRepository = unitRef.get(
      getRepositoryToken(MovieDetail) as string,
    );
    directorRepository = unitRef.get(getRepositoryToken(Director) as string);
    genreRepository = unitRef.get(getRepositoryToken(Genre) as string);
    userRepository = unitRef.get(getRepositoryToken(User) as string);
    movieUserLikeRepository = unitRef.get(
      getRepositoryToken(MovieUserLike) as string,
    );
    dataSource = unitRef.get(DataSource);
    commonService = unitRef.get(CommonService);
    cacheManager = unitRef.get(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(movieService).toBeDefined();
  });

  describe('findRecent', () => {
    const mockMovies = [
      { id: 1, name: 'Movie 1', createdAt: new Date() },
      { id: 2, name: 'Movie 2', createdAt: new Date() },
    ];
    it('should return recent movies from cache', async () => {
      jest.spyOn(cacheManager, 'get').mockResolvedValue(mockMovies);

      const result = await movieService.findRecent();

      expect(cacheManager.get).toHaveBeenCalledWith('movieRecent');
      expect(result).toEqual(mockMovies);
    });

    it('should return recent movies from database', async () => {
      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      jest
        .spyOn(movieRepository, 'find')
        .mockResolvedValue(mockMovies as Movie[]);

      const result = await movieService.findRecent();

      expect(cacheManager.get).toHaveBeenCalledWith('movieRecent');
      expect(cacheManager.set).toHaveBeenCalledWith('movieRecent', mockMovies);
      expect(result).toEqual(mockMovies);
    });
  });

  describe('findAll', () => {
    let getMoviesMock: jest.SpyInstance;
    let getLikedMovieMock: jest.SpyInstance;

    beforeEach(() => {
      getMoviesMock = jest.spyOn(movieService, 'getMovies');
      getLikedMovieMock = jest.spyOn(movieService, 'getLikedMovies');
    });

    it('should return all movies', async () => {
      const movies = [
        { id: 1, name: 'Movie 1', createdAt: new Date() },
        { id: 2, name: 'Movie 2', createdAt: new Date() },
      ];
      const dto = { name: 'Movie 1' } as GetMoviesDto;
      const mockLikedMovies = [
        { id: 1, isLike: true },
        { id: 2, isLike: false },
      ];
      const qb: any = {
        where: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([movies, 1]),
      };
      getMoviesMock.mockResolvedValue(qb);
      jest
        .spyOn(commonService, 'applyCursorPaginationParamsToQb')
        .mockResolvedValue({ nextCursor: null } as any);

      const result = await movieService.findAll(dto);

      expect(getMoviesMock).toHaveBeenCalled();
      expect(qb.where).toHaveBeenCalledWith('movie.name LIKE :name', {
        name: '%Movie 1%',
      });
      expect(
        commonService.applyCursorPaginationParamsToQb,
      ).toHaveBeenCalledWith(qb, dto);
      expect(result).toEqual({
        data: movies,
        nextCursor: null,
        count: 1,
      });
    });

    it('should return liked movies', async () => {
      const movies = [
        { id: 1, name: 'Movie 1' },
        { id: 3, name: 'Movie 3' },
      ];
      const mockLikedMovies = [
        { movie: { id: 1 }, isLike: true },
        { movie: { id: 3 }, isLike: false },
      ];
      const dto = { name: 'Movie 1' } as GetMoviesDto;
      const qb: any = {
        where: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([movies, 1]),
      };

      getMoviesMock.mockReturnValue(qb);
      jest
        .spyOn(commonService, 'applyCursorPaginationParamsToQb')
        .mockReturnValue({ nextCursor: null } as any);
      getLikedMovieMock.mockReturnValue(mockLikedMovies);

      const userId = 1;
      const result = await movieService.findAll(dto, userId);

      expect(getMoviesMock).toHaveBeenCalled();
      expect(qb.where).toHaveBeenCalledWith('movie.name LIKE :name', {
        name: '%Movie 1%',
      });
      expect(
        commonService.applyCursorPaginationParamsToQb,
      ).toHaveBeenCalledWith(qb, dto);
      expect(qb.getManyAndCount).toHaveBeenCalled();
      expect(getLikedMovieMock).toHaveBeenCalledWith(
        movies.map((movie) => movie.id),
        userId,
      );
      expect(result).toEqual({
        data: [
          {
            id: 1,
            name: 'Movie 1',
            likeStatus: true,
          },
          {
            id: 3,
            name: 'Movie 3',
            likeStatus: false,
          },
        ],
        count: 1,
        nextCursor: null,
      });
    });

    it('should return movies without name filter', async () => {
      const movies = [
        { id: 1, name: 'Movie 1' },
        { id: 2, name: 'Movie 2' },
      ];
      const dto = {} as GetMoviesDto;
      const qb: any = {
        getManyAndCount: jest.fn().mockResolvedValue([movies, 1]),
      };

      getMoviesMock.mockReturnValue(qb);
      jest
        .spyOn(commonService, 'applyCursorPaginationParamsToQb')
        .mockReturnValue({
          nextCursor: null,
        } as any);

      const result = await movieService.findAll(dto);

      expect(getMoviesMock).toHaveBeenCalled();
      expect(qb.getManyAndCount).toHaveBeenCalled();
      expect(result).toEqual({
        data: movies,
        count: 1,
        nextCursor: null,
      });
    });
  });

  describe('findOne', () => {
    let findMovieDetailMock: jest.SpyInstance;
    beforeEach(() => {
      findMovieDetailMock = jest.spyOn(movieService, 'findMovieDetail');
    });

    it('should return a movie if found', async () => {
      const movie = { id: 1, name: 'Movie 1' };

      findMovieDetailMock.mockResolvedValue(movie);

      const result = await movieService.findOne(1);

      expect(findMovieDetailMock).toHaveBeenCalledWith(1);
      expect(result).toEqual(movie);
    });

    it('should throw an error if movie is not found', async () => {
      findMovieDetailMock.mockResolvedValue(null);

      await expect(movieService.findOne(1)).rejects.toThrow(NotFoundException);
      expect(findMovieDetailMock).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    let qr: jest.Mocked<QueryRunner>;
    let createMovieMock: jest.SpyInstance;
    let createMovieDetailMock: jest.SpyInstance;
    let createMovieGenreRelationMock: jest.SpyInstance;
    let renameMovieFileMock: jest.SpyInstance;

    beforeEach(() => {
      qr = {
        manager: {
          findOne: jest.fn(),
          find: jest.fn(),
        },
      } as any as jest.Mocked<QueryRunner>;
      createMovieDetailMock = jest.spyOn(movieService, 'createMovieDetail');
      createMovieMock = jest.spyOn(movieService, 'createMovie');
      createMovieGenreRelationMock = jest.spyOn(
        movieService,
        'createMovieGenreRelation',
      );
      renameMovieFileMock = jest.spyOn(movieService, 'renameMovieFile');
    });

    it('should create a movie', async () => {
      const createMovieDto: CreateMovieDto = {
        name: 'Movie',
        directorId: 1,
        genreIds: [1, 2],
        movieFileName: 'movie.mp4',
        detail: 'Detail',
        rating: 5,
        year: 2020,
        actors: ['Actor 1', 'Actor 2'],
      };

      const userId = 1;
      const director = { id: 1, name: 'Director' } as Director;
      const genres = [
        { id: 1, name: 'Genre 1' },
        { id: 2, name: 'Genre 2' },
      ] as Genre[];
      const movieDetailInsertResult = { identifiers: [{ id: 1 }] };
      const movieInsertResult = { identifiers: [{ id: 1 }] } as any;
      (qr.manager.findOne as any).mockResolvedValueOnce(director);
      (qr.manager.findOne as any).mockResolvedValueOnce({
        ...createMovieDto,
        id: 1,
      });
      (qr.manager.find as any).mockResolvedValueOnce(genres);

      createMovieDetailMock.mockResolvedValue(movieDetailInsertResult);
      createMovieMock.mockResolvedValue(movieInsertResult);
      createMovieGenreRelationMock.mockResolvedValue(undefined);
      renameMovieFileMock.mockResolvedValue(undefined);

      const result = await movieService.create(createMovieDto, qr, userId);

      expect(qr.manager.findOne).toHaveBeenCalledWith(Director, {
        where: {
          id: createMovieDto.directorId,
        },
      });
      expect(qr.manager.find).toHaveBeenCalledWith(Genre, {
        where: {
          id: In(createMovieDto.genreIds),
        },
      });
      expect(createMovieDetailMock).toHaveBeenCalledWith(qr, createMovieDto);
      expect(createMovieMock).toHaveBeenCalledWith(
        qr,
        createMovieDto,
        director,
        movieDetailInsertResult.identifiers[0].id,
        userId,
        expect.any(String),
      );
      expect(createMovieGenreRelationMock).toHaveBeenCalledWith(
        qr,
        movieInsertResult.identifiers[0].id,
        genres,
      );
      expect(renameMovieFileMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        createMovieDto,
      );
      expect(result).toEqual({
        ...createMovieDto,
        id: 1,
      });
    });

    it('should throw NotFoundException if director does not exist', async () => {
      const createMovieDto: CreateMovieDto = {
        name: 'Movie',
        directorId: 1,
        genreIds: [1, 2],
        movieFileName: 'movie.mp4',
        detail: 'Detail',
        rating: 5,
        year: 2020,
        actors: ['Actor 1', 'Actor 2'],
      };
      const userId = 1;
      (qr.manager.findOne as any).mockResolvedValueOnce(null);

      await expect(
        movieService.create(createMovieDto, qr, userId),
      ).rejects.toThrow(NotFoundException);
      expect(qr.manager.findOne).toHaveBeenCalledWith(Director, {
        where: {
          id: createMovieDto.directorId,
        },
      });
    });

    it('should throw NotFoundException if genres do not exist', async () => {
      const createMovieDto: CreateMovieDto = {
        name: 'Movie',
        directorId: 1,
        genreIds: [1, 2],
        movieFileName: 'movie.mp4',
        detail: 'Detail',
        rating: 5,
        year: 2020,
        actors: ['Actor 1', 'Actor 2'],
      };
      const userId = 1;
      const director = {
        id: 1,
        name: 'Director',
      };

      (qr.manager.findOne as any).mockResolvedValueOnce(director);
      (qr.manager.find as any).mockResolvedValueOnce([
        {
          id: 1,
          name: 'Genre1',
        },
      ]);

      await expect(
        movieService.create(createMovieDto, qr, userId),
      ).rejects.toThrow(NotFoundException);

      expect(qr.manager.findOne).toHaveBeenCalledWith(Director, {
        where: {
          id: createMovieDto.directorId,
        },
      });
      expect(qr.manager.find).toHaveBeenCalledWith(Genre, {
        where: {
          id: In(createMovieDto.genreIds),
        },
      });
    });
  });
});
