import { Test, TestingModule } from '@nestjs/testing';
import { MovieService } from './movie.service';
import { TestBed } from '@automock/jest';
import { CommonService } from 'src/common/common.service';
import { Movie } from './entity/movie.entity';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { DataSource, Repository } from 'typeorm';
import { Cache } from 'cache-manager';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Genre } from 'src/genre/entities/genre.entity';
import { User } from 'src/user/entities/user.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
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
});
