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
import { Genre } from 'src/genre/entity/genre.entity';
import { User } from 'src/user/entities/user.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

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

  describe('update', () => {
    let qr: jest.Mocked<QueryRunner>;
    let updateMovieMock: jest.SpyInstance;
    let updateMovieDetailMock: jest.SpyInstance;
    let updateMovieGenreRelationMock: jest.SpyInstance;

    beforeEach(() => {
      qr = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          findOne: jest.fn(),
          find: jest.fn(),
        },
      } as any as jest.Mocked<QueryRunner>;

      updateMovieMock = jest.spyOn(movieService, 'updateMovie');
      updateMovieDetailMock = jest.spyOn(movieService, 'updateMovieDetail');
      updateMovieGenreRelationMock = jest.spyOn(
        movieService,
        'updateMovieGenreRelation',
      );

      jest.spyOn(dataSource, 'createQueryRunner').mockReturnValue(qr);
    });

    it('should update a movie successfully', async () => {
      const updateMovieDto: UpdateMovieDto = {
        name: 'Updated Movie',
        directorId: 1,
        genreIds: [1, 2],
        detail: 'Updated detail',
      };
      const movie = {
        id: 1,
        detail: { id: 1 },
        genres: [{ id: 1 }, { id: 2 }],
      };
      const director = { id: 1, name: 'Director' };
      const genres = [
        {
          id: 1,
          name: 'Genre1',
        },
        {
          id: 2,
          name: 'Genre2',
        },
      ];

      (qr.connect as any).mockResolvedValue(null);
      (qr.manager.findOne as any).mockResolvedValueOnce(movie);
      (qr.manager.findOne as any).mockResolvedValueOnce(director);
      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(movie as Movie);
      (qr.manager.find as any).mockRejectedValueOnce(genres);

      updateMovieMock.mockResolvedValue(undefined);
      updateMovieDetailMock.mockResolvedValue(undefined);
      updateMovieGenreRelationMock.mockResolvedValue(undefined);

      const result = await movieService.update(1, updateMovieDto);

      expect(qr.connect).toHaveBeenCalled();
      expect(qr.startTransaction).toHaveBeenCalled();
      expect(qr.manager.findOne).toHaveBeenCalledWith(Movie, {
        where: { id: 1 },
        relations: ['detail', 'director', 'genres'],
      });
      expect(qr.manager.findOne).toHaveBeenCalledWith(Director, {
        where: {
          id: updateMovieDto.directorId,
        },
      });
      expect(qr.manager.find).toHaveBeenCalledWith(Genre, {
        where: {
          id: In(updateMovieDto.genreIds),
        },
      });
      expect(updateMovieMock).toHaveBeenCalledWith(qr, expect.any(Object), 1);
      expect(updateMovieDetailMock).toHaveBeenCalledWith(
        qr,
        updateMovieDto.detail,
        movie,
      );
      expect(updateMovieGenreRelationMock).toHaveBeenCalledWith(
        qr,
        1,
        genres,
        movie,
      );
      expect(qr.commitTransaction).toHaveBeenCalled();
      expect(result).toEqual(movie);
    });

    it('should throw NotFoundException if movie does not exist', async () => {
      const updateMovieDto: UpdateMovieDto = {
        name: 'updated movie',
      };

      (qr.manager.findOne as any).mockResolvedValue(null);

      await expect(movieService.update(1, updateMovieDto)).rejects.toThrow(
        NotFoundException,
      );

      expect(qr.connect).toHaveBeenCalled();
      expect(qr.startTransaction).toHaveBeenCalled();
      expect(qr.manager.findOne).toHaveBeenCalledWith(Movie, {
        where: {
          id: 1,
        },
        relations: ['detail', 'director', 'genres'],
      });
      expect(qr.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if new director does not exist', async () => {
      const updateMovieDto: UpdateMovieDto = {
        name: 'Updated Movie',
        directorId: 1,
      };
      const movie = { id: 1, detail: { id: 1 }, genres: [] };

      (qr.manager.findOne as any).mockResolvedValueOnce(movie);
      (qr.manager.findOne as any).mockResolvedValueOnce(null);

      await expect(movieService.update(1, updateMovieDto)).rejects.toThrow(
        NotFoundException,
      );

      expect(qr.manager.findOne).toHaveBeenCalledWith(Movie, {
        where: { id: 1 },
        relations: ['detail', 'director', 'genres'],
      });
      expect(qr.manager.findOne).toHaveBeenCalledWith(Director, {
        where: {
          id: updateMovieDto.directorId,
        },
      });
      expect(qr.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if new genres do not exist', async () => {
      const updateMovieDto: UpdateMovieDto = {
        name: 'Updated Movie',
        genreIds: [1, 2],
      };
      const movie = {
        id: 1,
        detail: { id: 1 },
        genres: [],
      };

      (qr.manager.findOne as any).mockResolvedValueOnce(movie);
      (qr.manager.find as any).mockResolvedValueOnce([
        { id: 1, name: 'Genre1 ' },
      ]);

      await expect(movieService.update(1, updateMovieDto)).rejects.toThrow(
        NotFoundException,
      );

      expect(qr.manager.findOne).toHaveBeenCalledWith(Movie, {
        where: { id: 1 },
      });
      expect(qr.manager.find).toHaveBeenCalledWith(Genre, {
        where: {
          id: In(updateMovieDto.genreIds),
        },
      });
      expect(qr.rollbackTransaction).toHaveBeenCalled();
    });

    it('should rollback transaction and rethrow error on failure', async () => {
      const updateMovieDto: UpdateMovieDto = {
        name: 'Updated Movie',
      };

      (qr.manager.findOne as any).mockRejectedValueOnce(
        new Error('Database Error'),
      );

      await expect(movieService.update(1, updateMovieDto)).rejects.toThrow(
        'Database Error',
      );

      expect(qr.connect).toHaveBeenCalled();
      expect(qr.startTransaction).toHaveBeenCalled();
      expect(qr.manager.findOne).toHaveBeenCalledWith(Movie, {
        where: { id: 1 },
        relations: ['detail', 'director', 'genres'],
      });
      expect(qr.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    let findOneMock: jest.SpyInstance;
    let deleteMovieMock: jest.SpyInstance;
    let deleteMovieDetailMock: jest.SpyInstance;

    beforeEach(() => {
      findOneMock = jest.spyOn(movieRepository, 'findOne');
      deleteMovieMock = jest.spyOn(movieService, 'deleteMovie');
      deleteMovieDetailMock = jest.spyOn(movieDetailRepository, 'delete');
    });

    it('should remove a movie successfully', async () => {
      const movie = { id: 1, detail: { id: 2 } };

      findOneMock.mockResolvedValue(movie);
      deleteMovieMock.mockResolvedValue(undefined);
      deleteMovieDetailMock.mockResolvedValue(undefined);

      const result = await movieService.remove(1);

      expect(findOneMock).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['detail', 'director', 'genres'],
      });
      expect(deleteMovieMock).toHaveBeenCalledWith(1);
      expect(deleteMovieDetailMock).toHaveBeenCalledWith(movie.detail.id);
      expect(result).toBe(1);
    });

    it('should throw NotFoundException if movie does not exist', async () => {
      findOneMock.mockResolvedValue(null);

      await expect(movieService.remove(1)).rejects.toThrow(NotFoundException);

      expect(findOneMock).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['detail'],
      });
      expect(deleteMovieMock).not.toHaveBeenCalled();
      expect(deleteMovieDetailMock).not.toHaveBeenCalled();
    });
  });

  describe('toggleMovieLike', () => {
    let findOneMovieMock: jest.SpyInstance;
    let findOneUserMock: jest.SpyInstance;
    let getLikedRecordMock: jest.SpyInstance;
    let deleteLikeMock: jest.SpyInstance;
    let updateLikeMock: jest.SpyInstance;
    let saveLikeMock: jest.SpyInstance;

    beforeEach(() => {
      findOneMovieMock = jest.spyOn(movieRepository, 'findOne');
      findOneUserMock = jest.spyOn(userRepository, 'findOne');
      getLikedRecordMock = jest.spyOn(movieService, 'getLikedRecord');
      deleteLikeMock = jest.spyOn(movieUserLikeRepository, 'delete');
      updateLikeMock = jest.spyOn(movieUserLikeRepository, 'update');
      saveLikeMock = jest.spyOn(movieUserLikeRepository, 'save');
    });

    it('should toggle movie like status successfully when like record exists and isLike is different', async () => {
      const movie = { id: 1 };
      const user = { id: 1 };
      const likedRecord = { movie, user, isLike: true };

      findOneMovieMock.mockResolvedValue(movie);
      findOneUserMock.mockResolvedValue(user);
      getLikedRecordMock
        .mockResolvedValueOnce(likedRecord)
        .mockResolvedValueOnce({ isLike: false });

      const result = await movieService.toggleMovieLike(1, 1, false);

      expect(findOneMovieMock).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(findOneUserMock).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(getLikedRecordMock).toHaveBeenCalledWith(1, 1);
      expect(updateLikeMock).toHaveBeenCalledWith(
        {
          movie,
          user,
        },
        { isLike: false },
      );

      expect(result).toEqual({ isLike: false });
    });

    it('should delete like record when isLike is the same as the existing record', async () => {
      const movie = { id: 1 };
      const user = { id: 1 };
      const likedRecord = { movie, user, isLike: true };

      findOneMovieMock.mockResolvedValue(movie);
      findOneUserMock.mockResolvedValue(user);
      getLikedRecordMock
        .mockResolvedValueOnce(likedRecord)
        .mockResolvedValueOnce(null);

      const result = await movieService.toggleMovieLike(1, 1, true);

      expect(findOneMovieMock).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(findOneUserMock).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(getLikedRecordMock).toHaveBeenCalledWith(1, 1);
      expect(deleteLikeMock).toHaveBeenCalledWith({ movie, user });
      expect(result).toEqual({ isLike: null });
    });

    it('should save a new like record when no existing record is found', async () => {
      const movie = { id: 1 };
      const user = { id: 1 };

      findOneMovieMock.mockResolvedValue(movie);
      findOneUserMock.mockResolvedValue(user);
      getLikedRecordMock
        .mockResolvedValueOnce(null)
        .mockRejectedValueOnce({ isLike: true });

      const result = await movieService.toggleMovieLike(1, 1, true);

      expect(findOneMovieMock).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(findOneUserMock).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(getLikedRecordMock).toHaveBeenCalledWith(1, 1);
      expect(saveLikeMock).toHaveBeenCalledWith({ movie, user, isLike: true });
      expect(result).toEqual({ isLike: true });
    });

    it('should throw BadRequestException if movie does not exist', async () => {
      findOneMovieMock.mockResolvedValue(null);

      await expect(movieService.toggleMovieLike(1, 1, true)).rejects.toThrow(
        BadRequestException,
      );

      expect(findOneMovieMock).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(findOneUserMock).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      const movie = { id: 1 };

      findOneMovieMock.mockResolvedValue(movie);
      findOneUserMock.mockResolvedValue(null);

      await expect(movieService.toggleMovieLike(1, 1, true)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(findOneMovieMock).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(findOneUserMock).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });
});
