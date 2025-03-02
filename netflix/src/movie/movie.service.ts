import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entities/genre.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CommonService } from 'src/common/common.service';
import { join } from 'path';
import { rename } from 'fs/promises';
import { User } from 'src/user/entities/user.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';

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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(MovieUserLike)
    private readonly movieUserLikeRepository: Repository<MovieUserLike>,
    private readonly dataSource: DataSource,
    private readonly commonService: CommonService,
  ) {}

  async findAll(dto: GetMoviesDto, userId?: number) {
    const { name } = dto;
    const query = await this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.detail', 'detail')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres')
      .leftJoinAndSelect('movie.creator', 'creator');

    if (name) {
      query.where('movie.name LIKE :name', {
        name: `%${name}%`,
      });
    }
    const { nextCursor } =
      await this.commonService.applyCursorPaginationParamsToQb(query, dto);
    let [data, count] = await query.getManyAndCount();

    if (userId) {
      const movieIds = data.map((movie) => movie.id);

      const likedMovies = await this.movieUserLikeRepository
        .createQueryBuilder('mul')
        .leftJoinAndSelect('mul.user', 'user')
        .leftJoinAndSelect('mul.movie', 'movie')
        .where('movie.id IN (:...movieIds)', { movieIds })
        .andWhere('user.id = :userId', { userId })
        .getMany();

      const likedMovieMap = likedMovies.reduce(
        (acc, next) => ({
          ...acc,
          [next.movie.id]: next.isLike,
        }),
        {},
      );

      data = data.map((movie) => {
        return {
          ...movie,
          likeStatus:
            movie.id in likedMovieMap ? likedMovieMap[movie.id] : null,
        };
      });
    }
    return {
      data,
      count,
      nextCursor,
    };
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
  }

  async create(dto: CreateMovieDto, queryRunner: QueryRunner, userId: number) {
    const { directorId, detail, genreIds, movieFileName, ...movieInfo } = dto;
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
    const tempFolder = join('public', 'temp');

    // cascade: true 옵션을 주면 영화 상세 정보를 생성할 때 영화 정보도 함께 생성된다.
    const movie = await queryRunner.manager.save(Movie, {
      ...movieInfo,
      detail: {
        detail: detail,
      },
      director,
      genres,
      movieFilePath: join(movieFolder, movieFileName),
      creator: {
        id: userId,
      },
    });
    await rename(
      join(process.cwd(), tempFolder, movieFileName),
      join(process.cwd(), movieFolder, movieFileName),
    );
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
      if (detail) {
        await queryRunner.manager
          .createQueryBuilder()
          .update(MovieDetail)
          .set({ detail })
          .where('id = :id', { id: movie.detail.id })
          .execute();
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

  async toggleMovieLike(movieId: number, userId: number, isLike: boolean) {
    const movie = await this.movieRepository.findOne({
      where: {
        id: movieId,
      },
    });
    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new UnauthorizedException('존재하지 않는 ID의 유저입니다.');
    }

    const likeRecord = await this.movieUserLikeRepository
      .createQueryBuilder('mul')
      .leftJoinAndSelect('mul.movie', 'movie')
      .leftJoinAndSelect('mul.user', 'user')
      .where('movie.id = :movieId', { movieId })
      .andWhere('user.id = :userId', { userId })
      .getOne();

    if (!likeRecord) {
      await this.movieUserLikeRepository.save({
        movie,
        user,
        isLike,
      });
    }
    if (likeRecord && likeRecord.isLike === isLike) {
      await this.movieUserLikeRepository.delete({
        movie,
        user,
      });
    } else {
      await this.movieUserLikeRepository.update(
        {
          movie,
          user,
        },
        {
          isLike,
        },
      );
    }

    const result = await this.movieUserLikeRepository
      .createQueryBuilder('mul')
      .leftJoinAndSelect('mul.movie', 'movie')
      .leftJoinAndSelect('mul.user', 'user')
      .where('movie.id = :movieId', { movieId })
      .andWhere('user.id = :userId', { userId })
      .getOne();
    return {
      isLike: result && result.isLike,
    };
  }
}
