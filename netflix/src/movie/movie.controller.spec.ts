import { Test, TestingModule } from '@nestjs/testing';
import { MovieController } from './movie.controller';
import { MovieService } from './movie.service';
import { TestBed } from '@automock/jest';
import { CreateMovieDto } from './dto/create-movie.dto';
import { QueryRunner } from 'typeorm';
import { UpdateMovieDto } from './dto/update-movie.dto';

describe('MovieController', () => {
  let controller: MovieController;
  let service: jest.Mocked<MovieService>;

  beforeEach(async () => {
    const { unit, unitRef } = await TestBed.create(MovieController).compile();

    controller = unit;
    service = unitRef.get<MovieService>(MovieService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMovies', () => {
    it('should call movieService.findAll with the correct parameters', async () => {
      const dto = { page: 1, limit: 10 };
      const userId = 1;
      const movies = [{ id: 1 }, { id: 2 }];

      jest.spyOn(service, 'findAll').mockResolvedValue(movies as any);

      const result = await controller.getMovies(dto as any, userId);

      expect(service.findAll).toHaveBeenCalledWith(dto, userId);
      expect(result).toEqual(movies);
    });
  });

  describe('recent', () => {
    it('should call movieService.findRecent', async () => {
      await controller.getMoviesRecent();

      expect(service.findRecent).toHaveBeenCalled();
    });
  });

  describe('getMovie', () => {
    it('should call movieService.findOne with the correct id', async () => {
      const id = 1;
      await controller.getMovie(id);
      expect(service.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('postMovie', () => {
    it('should call movieService.create with the correct parameters', async () => {
      const body = { name: 'Test Movie' };
      const userId = 1;
      const queryRunner = {};

      await controller.postMovie(
        body as CreateMovieDto,
        queryRunner as QueryRunner,
        userId,
      );

      expect(service.create).toHaveBeenCalledWith(body, queryRunner, userId);
    });
  });

  describe('patchMovie', () => {
    it('should call movieService.update with the correct parameters', async () => {
      const id = 1;
      const body: UpdateMovieDto = { name: 'Updated Movie' };

      await controller.patchMovie(id, body);

      expect(service.update).toHaveBeenCalledWith(id, body);
    });
  });

  describe('deleteMovie', () => {
    it('should call movieService.remove with the correct id', async () => {
      const id = 1;
      await controller.deleteMovie(id);
      expect(service.remove).toHaveBeenCalledWith(id);
    });
  });

  describe('createMovieLike', () => {
    it('should call movieService.toggleMovieLike with the correct parameters', async () => {
      const movieId = 1;
      const userId = 2;

      await controller.createMovieLike(movieId, userId);

      expect(service.toggleMovieLike).toHaveBeenCalledWith(
        movieId,
        userId,
        true,
      );
    });
  });

  describe('createMovieDislike', () => {
    it('should call movieService.toggleMovieDislike with the correct parameters', async () => {
      const movieId = 1;
      const userId = 2;

      await controller.createMovieDislike(movieId, userId);

      expect(service.toggleMovieLike).toHaveBeenCalledWith(
        movieId,
        userId,
        false,
      );
    });
  });
});
