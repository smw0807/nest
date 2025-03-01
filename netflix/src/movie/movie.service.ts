import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, In, QueryRunner, Repository } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entities/genre.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CommonService } from 'src/common/common.service';
import { join } from 'path';

/**
 * @Injectable() 이란
 * 모든 서비스 클래스는 @Injectable() 데코레이터를 붙여야 한다.
 * 이 데코레이터는 클래스를 NestJS 서비스로 표시하고, 의존성 주입을 활성화한다.
 * 이 데코레이터가 없으면 클래스는 일반 클래스로 취급되고, 의존성 주입을 받을 수 없다.
 *
 * IoC 컨테이너
 * 모든 서비스 클래스는 IoC 컨테이너에 등록되어야 한다.
 * 이 컨테이너는 서비스 클래스의 인스턴스를 생성하고, 관리한다.
 */

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(MovieDetail)
    private readonly movieDetailRepository: Repository<MovieDetail>,
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
    private readonly dataSource: DataSource,
    private readonly commonService: CommonService,
  ) {}

  async findAll(dto: GetMoviesDto) {
    const { name } = dto;
    const query = await this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.detail', 'detail')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres');

    if (name) {
      query.where('movie.name LIKE :name', {
        name: `%${name}%`,
      });
    }
    // if (take && page) {
    //   this.commonService.applyPagePaginationParamsToQb(query, {
    //     page,
    //     take,
    //   });
    // }
    const { nextCursor } =
      await this.commonService.applyCursorPaginationParamsToQb(query, dto);
    const [data, count] = await query.getManyAndCount();
    return {
      data,
      count,
      nextCursor,
    };
    // return this.movieRepository.findAndCount({
    //   where: {
    //     name: name ? ILike(`%${name}%`) : undefined,
    //   },
    //   relations: ['director', 'genres'],
    // });
  }

  findOne(id: number) {
    const movie = this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.detail', 'detail')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres')
      .where('movie.id = :id', { id: id })
      .getOne();
    return movie;
    // const movie = this.movieRepository.findOne({
    //   where: { id },
    //   relations: ['detail', 'director', 'genres'],
    // });
    // if (!movie) {
    //   throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    // }
    // return movie;
  }

  async create(
    dto: CreateMovieDto,
    movieFileName: string,
    queryRunner: QueryRunner,
  ) {
    const { directorId, detail, genreIds, ...movieInfo } = dto;
    const director = await queryRunner.manager.findOne(Director, {
      where: { id: directorId },
    });
    if (!director) {
      throw new NotFoundException('존재하지 않는 ID의 감독입니다.');
    }
    const genres = await queryRunner.manager.find(Genre, {
      where: { id: In(genreIds) },
    });
    if (genres.length !== genreIds.length) {
      throw new NotFoundException(
        `존재하지 않는 장르가 있습니다. 존재하는 ids => ${genres.map((genre) => genre.id).join(',')}`,
      );
    }
    const movieFolder = join('public', 'movie');
    // cascade: true 옵션을 주면 영화 상세 정보를 생성할 때 영화 정보도 함께 생성된다.
    const movie = await queryRunner.manager.save(Movie, {
      ...movieInfo,
      detail: {
        detail: detail,
      },
      director,
      genres,
      movieFilePath: join(movieFolder, movieFileName),
    });
    return movie;
  }

  async update(id: number, dto: UpdateMovieDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const movie = await this.findOne(id);
      if (!movie) {
        throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
      }
      const { detail, directorId, genreIds, ...movieInfo } = dto;
      // 감독
      let newDirector;
      if (directorId) {
        const director = await queryRunner.manager.findOne(Director, {
          where: { id: directorId },
        });
        if (!director) {
          throw new NotFoundException('존재하지 않는 ID의 감독입니다.');
        }
        newDirector = director;
      }
      // 장르
      let newGenres;
      if (genreIds) {
        const genres = await queryRunner.manager.find(Genre, {
          where: { id: In(genreIds) },
        });
        if (genres.length !== genreIds.length) {
          throw new NotFoundException(
            `존재하지 않는 장르가 있습니다. 존재하는 ids => ${genres.map((genre) => genre.id).join(',')}`,
          );
        }
        newGenres = genres;
      }
      const movieUpdateFields = {
        ...movieInfo,
        ...(newDirector && { director: newDirector }),
      };
      await queryRunner.manager
        .createQueryBuilder()
        .update(Movie)
        .set(movieUpdateFields)
        .where('id = :id', { id })
        .execute();
      // await this.movieRepository.update(id, {
      //   ...movieInfo,
      //   ...(newDirector && { director: newDirector }),
      // });
      if (detail) {
        await queryRunner.manager
          .createQueryBuilder()
          .update(MovieDetail)
          .set({ detail })
          .where('id = :id', { id: movie.detail.id })
          .execute();
        // await this.movieDetailRepository.update(movie.detail.id, { detail });
      }
      if (newGenres) {
        //Many To Many 관계에서 추가와 제거를 동시에 할 때 사용
        await queryRunner.manager
          .createQueryBuilder()
          .relation(Movie, 'genres')
          .of(movie.id)
          .addAndRemove(
            newGenres.map((genre) => genre.id),
            movie.genres.map((genre) => genre.id),
          );
      }
      // const newMovie = await this.movieRepository.findOne({
      //   where: { id: movie.detail.id },
      //   relations: ['detail', 'director'],
      // });
      // newMovie.genres = newGenres;
      // await this.movieRepository.save(newMovie);
      const result = await queryRunner.manager.findOne(Movie, {
        where: { id: movie.detail.id },
        relations: ['detail', 'director', 'genres'],
      });
      await queryRunner.commitTransaction();
      return result;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number) {
    const movie = await this.findOne(id);
    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }
    // await this.movieRepository.delete(id);
    await this.movieRepository
      .createQueryBuilder()
      .delete()
      .where('id = :id', { id })
      .execute();
    if (movie.detail) {
      await this.movieDetailRepository.delete(movie.detail.id);
    }
    return id;
  }
}
