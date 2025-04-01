import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
// import { Movie } from './entity/movie.entity';
// import { InjectRepository } from '@nestjs/typeorm';
import {
  // DataSource, In,
  QueryRunner,
  //  Repository
} from 'typeorm';
// import { MovieDetail } from './entity/movie-detail.entity';
// import { Director } from 'src/director/entity/director.entity';
// import { Genre } from 'src/genre/entity/genre.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CommonService } from 'src/common/common.service';
import { join } from 'path';
import { rename } from 'fs/promises';
// import { User } from 'src/user/entities/user.entity';
// import { MovieUserLike } from './entity/movie-user-like.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { envVariableKeys } from 'src/common/constants/env.const';
// import { PrismaService } from 'src/common/prisma.service';
import { Prisma } from '@prisma/client';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Document } from 'mongoose';
import { MovieDetail } from './schema/movie-detail.schema';
import { Movie } from './schema/movie.schema';
import { MovieUserLike } from './schema/movie-user-like.schema';
import { Director } from 'src/director/schema/director.schema';
import { Genre } from 'src/genre/schema/genre.schema';
import { User } from 'src/user/schema/user.schema';
import { populate } from 'dotenv';

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
    // @InjectRepository(Movie)
    // private readonly movieRepository: Repository<Movie>,
    // @InjectRepository(MovieDetail)
    // private readonly movieDetailRepository: Repository<MovieDetail>,
    // @InjectRepository(Director)
    // private readonly directorRepository: Repository<Director>,
    // @InjectRepository(Genre)
    // private readonly genreRepository: Repository<Genre>,
    // @InjectRepository(User)
    // private readonly userRepository: Repository<User>,
    // @InjectRepository(MovieUserLike)
    // private readonly movieUserLikeRepository: Repository<MovieUserLike>,
    // private readonly prisma: PrismaService,
    // private readonly dataSource: DataSource,
    private readonly commonService: CommonService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
    @InjectModel(Movie.name)
    private readonly movieModel: Model<Movie>,
    @InjectModel(MovieDetail.name)
    private readonly movieDetailModel: Model<MovieDetail>,
    @InjectModel(MovieUserLike.name)
    private readonly movieUserLikeModel: Model<MovieUserLike>,
    @InjectModel(Director.name)
    private readonly directorModel: Model<Director>,
    @InjectModel(Genre.name)
    private readonly genreModel: Model<Genre>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async findRecent() {
    const cacheData = await this.cacheManager.get('movieRecent');
    if (cacheData) {
      return cacheData;
    }

    const data = await this.movieModel
      .find()
      .sort({ createdAt: -1 })
      .limit(10)
      .exec();
    // const data = await this.prisma.movie.findMany({
    //   orderBy: {
    //     createdAt: 'desc',
    //   },
    //   take: 10,
    // });
    // const data = await this.movieRepository.find({
    //   order: {
    //     createdAt: 'DESC',
    //   },
    //   take: 10,
    // });
    await this.cacheManager.set('movieRecent', data);
    return data;
  }

  /* istanbul ignore next */
  async getMovies() {
    // return this.movieRepository
    //   .createQueryBuilder('movie')
    //   .leftJoinAndSelect('movie.detail', 'detail')
    //   .leftJoinAndSelect('movie.director', 'director')
    //   .leftJoinAndSelect('movie.genres', 'genres')
    //   .leftJoinAndSelect('movie.creator', 'creator');
  }

  /* istanbul ignore next */
  async getLikedMovies(movieIds: number[], userId: number) {
    // return this.movieUserLikeRepository
    //   .createQueryBuilder('mul')
    //   .leftJoinAndSelect('mul.user', 'user')
    //   .leftJoinAndSelect('mul.movie', 'movie')
    //   .where('movie.id IN (:...movieIds)', { movieIds })
    //   .andWhere('user.id = :userId', { userId })
    //   .getMany();
  }

  async findAll(dto: GetMoviesDto, userId?: number) {
    const { name, cursor, order, take } = dto;

    const orderBy = order.reduce((acc, field) => {
      const [column, direction] = field.split('_');
      acc[column] = direction.toLowerCase();
      return acc;
    }, {});
    // const orderBy = order.map((field) => {
    //   const [column, direction] = field.split('_');
    //   return {
    //     [column]: direction.toLocaleLowerCase(),
    //   };
    // });
    // const query = await this.getMovies();

    const query = this.movieModel
      .find(name ? { name: { $regex: name }, $option: '1' } : {})
      .sort(orderBy)
      .limit(take + 1);

    if (cursor) {
      query.skip(1).gt('_id', new Types.ObjectId(cursor));
    }

    const movies = await query.populate('genres director').exec();
    // const movies = await this.prisma.movie.findMany({
    //   where: name
    //     ? {
    //         name: { contains: name },
    //       }
    //     : {},
    //   take: take + 1,
    //   skip: cursor ? 1 : 0,
    //   cursor: cursor ? { id: parseInt(cursor) } : undefined,
    //   orderBy,
    //   include: {
    //     genres: true,
    //     director: true,
    //   },
    // });
    // if (name) {
    //   query.where('movie.name LIKE :name', {
    //     name: `%${name}%`,
    //   });
    // }
    const hasNextPage = movies.length > take;
    if (hasNextPage) movies.pop();

    const nextCursor = hasNextPage
      ? movies[movies.length - 1]._id.toString()
      : null;

    // const { nextCursor } =
    //   await this.commonService.applyCursorPaginationParamsToQb(query, dto);
    // let [data, count] = await query.getManyAndCount();

    if (userId) {
      const movieIds = movies.map((movie) => movie._id);
      // const movieIds = data.map((movie) => movie.id);

      const likedMovies =
        movieIds.length < 1
          ? []
          : await this.movieUserLikeModel
              .find({
                movie: {
                  $in: movieIds,
                },
                user: userId,
              })
              .populate('movie')
              .exec();
      // const likedMovies =
      //   movieIds.length < 1
      //     ? []
      //     : await this.prisma.movieUserLike.findMany({
      //         where: {
      //           movieId: { in: movieIds },
      //           userId: userId,
      //         },
      //         include: {
      //           movie: true,
      //         },
      //       });
      // const likedMovies =
      //   movieIds.length < 1 ? [] : await this.getLikedMovies(movieIds, userId);

      const likedMovieMap = likedMovies.reduce(
        (acc, next) => ({
          ...acc,
          [next.movie._id.toString()]: next.isLike,
        }),
        {},
      );

      return {
        data: movies.map((movie) => ({
          ...movie,
          likeStatus:
            movie._id.toString() in likedMovieMap
              ? likedMovieMap[movie._id.toString()]
              : null,
        })) as (Document<unknown, {}, Movie> &
          Movie &
          Required<{
            _id: unknown;
          }> & {
            __v?: number;
          } & {
            likeStatus: boolean;
          })[],
        nextCursor,
        hasNextPage,
      };

      //   data = data.map((movie) => {
      //     return {
      //       ...movie,
      //       likeStatus:
      //         movie.id in likedMovieMap ? likedMovieMap[movie.id] : null,
      //     };
      //   });
    }
    return {
      data: movies,
      hasNextPage,
      nextCursor,
    };
  }
  /* istanbul ignore next */
  async findMovieDetail(id: number) {
    // return this.movieRepository
    //   .createQueryBuilder('movie')
    //   .leftJoinAndSelect('movie.detail', 'detail')
    //   .leftJoinAndSelect('movie.director', 'director')
    //   .leftJoinAndSelect('movie.genres', 'genres')
    //   .where('movie.id = :id', { id: id })
    //   .getOne();
  }
  async findOne(id: number) {
    const movie = await this.movieModel.findById(id).exec();
    // const movie = await this.prisma.movie.findUnique({
    //   where: {
    //     id,
    //   },
    // });
    // const movie = await this.findMovieDetail(id);
    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }
    return movie;
  }

  /* istanbul ignore next */
  async createMovieDetail(qr: QueryRunner, createMovieDto: CreateMovieDto) {
    // return qr.manager
    //   .createQueryBuilder()
    //   .insert()
    //   .into(MovieDetail)
    //   .values({
    //     detail: createMovieDto.detail,
    //   })
    //   .execute();
  }

  /* istanbul ignore next */
  createMovie(
    qr: QueryRunner,
    createMovieDto: CreateMovieDto,
    director: Director,
    movieDetailId: number,
    userId: number,
    movieFolder: string,
  ) {
    // return qr.manager
    //   .createQueryBuilder()
    //   .insert()
    //   .into(Movie)
    //   .values({
    //     name: createMovieDto.name,
    //     detail: {
    //       id: movieDetailId,
    //     },
    //     director,
    //     creator: {
    //       id: userId,
    //     },
    //     rating: createMovieDto.rating,
    //     year: createMovieDto.year,
    //     actors: createMovieDto.actors,
    //     movieFilePath: join(movieFolder, createMovieDto.movieFileName),
    //   })
    //   .execute();
  }

  /* istanbul ignore next */
  createMovieGenreRelation(qr: QueryRunner, movieId: number, genres: Genre[]) {
    // return qr.manager
    //   .createQueryBuilder()
    //   .relation(Movie, 'genres')
    //   .of(movieId)
    //   .add(genres.map((genre) => genre.id));
  }

  /* istanbul ignore next */
  renameMovieFile(
    tempFolder: string,
    movieFolder: string,
    createMovieDto: CreateMovieDto,
  ) {
    if (this.configService.get<string>(envVariableKeys.env) !== 'prod') {
      return rename(
        join(process.cwd(), tempFolder, createMovieDto.movieFileName),
        join(process.cwd(), movieFolder, createMovieDto.movieFileName),
      );
    } else {
      return this.commonService.saveMovieToPermanentStorage(
        createMovieDto.movieFileName,
      );
    }
  }

  async create(createMovieDto: CreateMovieDto, userId: number) {
    const session = await this.movieModel.startSession();
    session.startTransaction();
    try {
      const director = await this.directorModel
        .findById(createMovieDto.directorId)
        .exec();
      if (!director) {
        throw new NotFoundException('존재하지 않는 ID의 감독입니다!');
      }

      const genres = await this.genreModel
        .find({ _id: { $in: createMovieDto.genreIds } })
        .exec();
      if (genres.length !== createMovieDto.genreIds.length) {
        throw new NotFoundException(
          `존재하지 않는 장르가 있습니다! 존재하는 ids -> ${genres.map((genre) => genre.id).join(',')}`,
        );
      }

      const movieDetail = await this.movieDetailModel.create(
        [
          {
            detail: createMovieDto.detail,
          },
        ],
        {
          session,
        },
      );

      const movie = await this.movieModel.create([
        {
          name: createMovieDto.name,
          movieFilePath: createMovieDto.movieFileName,
          creator: userId,
          director: director._id,
          genres: genres.map((genre) => genre._id),
          detail: movieDetail[0]._id,
        },
      ]);

      await session.commitTransaction();

      return this.movieModel
        .findById(movie[0]._id)
        .populate('detail director genre')
        .exec();
    } catch (error) {
      console.error(error);
      await session.abortTransaction();
    } finally {
      session.endSession();
    }
    // return this.prisma.$transaction(async (prisma) => {
    //   const director = await prisma.director.findUnique({
    //     where: {
    //       id: createMovieDto.directorId,
    //     },
    //   });
    //   if (!director) {
    //     throw new NotFoundException('존재하지 않는 ID의 감독입니다!');
    //   }
    //   const genres = await prisma.genre.findMany({
    //     where: {
    //       id: { in: createMovieDto.genreIds },
    //     },
    //   });
    //   if (genres.length !== createMovieDto.genreIds.length) {
    //     throw new NotFoundException('존재하지 않는 장르가 있습니다!');
    //   }

    //   const movieDetail = await prisma.movieDetail.create({
    //     data: {
    //       detail: createMovieDto.detail,
    //     },
    //   });

    //   // const movieFolder = join('public', 'movie');
    //   // const tempFolder = join('public', 'temp');
    //   const movie = await prisma.movie.create({
    //     data: {
    //       name: createMovieDto.name,
    //       movieFilePath: createMovieDto.movieFileName,
    //       rating: createMovieDto.rating,
    //       year: createMovieDto.year,
    //       actors: createMovieDto.actors,
    //       creator: {
    //         connect: {
    //           id: userId,
    //         },
    //       },
    //       detail: {
    //         connect: {
    //           id: movieDetail.id,
    //         },
    //       },
    //       director: {
    //         connect: {
    //           id: director.id,
    //         },
    //       },
    //       genres: {
    //         connect: genres.map((genre) => ({ id: genre.id })),
    //       },
    //     },
    //   });

    //   return prisma.movie.findUnique({
    //     where: {
    //       id: movie.id,
    //     },
    //     include: {
    //       detail: true,
    //       director: true,
    //       genres: true,
    //     },
    //   });
    // });
  }

  // async create(
  //   createMovieDto: CreateMovieDto,
  //   qr: QueryRunner,
  //   userId: number,
  // ) {
  //   const director = await qr.manager.findOne(Director, {
  //     where: {
  //       id: createMovieDto.directorId,
  //     },
  //   });

  //   if (!director) {
  //     throw new NotFoundException('존재하지 않는 ID의 감독입니다!');
  //   }

  //   const genres = await qr.manager.find(Genre, {
  //     where: {
  //       id: In(createMovieDto.genreIds),
  //     },
  //   });

  //   if (genres.length !== createMovieDto.genreIds.length) {
  //     throw new NotFoundException(
  //       `존재하지 않는 장르가 있습니다! 존재하는 ids -> ${genres.map((genre) => genre.id).join(',')}`,
  //     );
  //   }

  //   const movieDetail = await this.createMovieDetail(qr, createMovieDto);

  //   const movieDetailId = movieDetail.identifiers[0].id;

  //   const movieFolder = join('public', 'movie');
  //   const tempFolder = join('public', 'temp');

  //   const movie = await this.createMovie(
  //     qr,
  //     createMovieDto,
  //     director,
  //     movieDetailId,
  //     userId,
  //     movieFolder,
  //   );

  //   const movieId = movie.identifiers[0].id;

  //   await this.createMovieGenreRelation(qr, movieId, genres);
  //   await this.renameMovieFile(tempFolder, movieFolder, createMovieDto);

  //   return await qr.manager.findOne(Movie, {
  //     where: {
  //       id: movieId,
  //     },
  //     relations: ['detail', 'director', 'genres'],
  //   });
  // }

  /* istanbul ignore next */
  updateMovie(qr: QueryRunner, movieUpdateFields: UpdateMovieDto, id: number) {
    // return qr.manager
    //   .createQueryBuilder()
    //   .update(Movie)
    //   .set(movieUpdateFields)
    //   .where('id = :id', { id })
    //   .execute();
  }

  /* istanbul ignore next */
  updateMovieDetail(qr: QueryRunner, detail: string, movie: Movie) {
    // return qr.manager
    //   .createQueryBuilder()
    //   .update(MovieDetail)
    //   .set({ detail })
    //   .where('id = :id', { id: movie.detail.id })
    //   .execute();
  }

  /* istanbul ignore next */
  updateMovieGenreRelation(
    qr: QueryRunner,
    id: number,
    newGenres: Genre[],
    movie: Movie,
  ) {
    // return qr.manager
    //   .createQueryBuilder()
    //   .relation(Movie, 'genres')
    //   .of(movie.id)
    //   .addAndRemove(
    //     newGenres.map((genre) => genre.id),
    //     movie.genres.map((genre) => genre.id),
    //   );
  }

  async update(id: number, dto: UpdateMovieDto) {
    const session = await this.movieModel.startSession();
    session.startTransaction();
    try {
      const movie = await this.movieModel
        .findById(id)
        .populate('detail')
        .populate('director')
        .populate('genres');
      if (!movie) {
        throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
      }

      const { detail, directorId, genreIds, ...movieRest } = dto;

      const movieUpdateParams: {
        name?: string;
        movieFileName?: string;
        director?: Types.ObjectId;
        genres?: Types.ObjectId[];
      } = {
        ...movieRest,
      };

      if (directorId) {
        const director = await this.directorModel.findById(directorId).exec();
        if (!director) {
          throw new NotFoundException('존재하지 않는 ID의 감독입니다.');
        }

        movieUpdateParams.director = director._id as Types.ObjectId;
      }

      if (genreIds) {
        const genres = await this.genreModel
          .find({
            _id: { $in: genreIds },
          })
          .exec();
        if (genres.length !== genreIds.length) {
          throw new NotFoundException(
            `존재하지 않는 장르가 있습니다. 존재하는 ids => ${genres.map((genre) => genre.id).join(',')}`,
          );
        }
      }

      if (detail) {
        await this.movieDetailModel.findByIdAndUpdate(id, movieUpdateParams);
      }

      await this.movieModel.findByIdAndUpdate(id, movieUpdateParams);

      await session.commitTransaction();

      return this.movieModel
        .findById(id)
        .populate('detail director')
        .populate({
          path: 'genres',
          model: 'Genre',
        })
        .exec();
    } catch (error) {
      console.error(error);
      await session.abortTransaction();
    } finally {
      session.endSession();
    }
    // return this.prisma.$transaction(async (prisma) => {
    //   const movie = await prisma.movie.findUnique({
    //     where: {
    //       id,
    //     },
    //     include: {
    //       detail: true,
    //       director: true,
    //       genres: true,
    //     },
    //   });
    //   if (!movie) {
    //     throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    //   }
    //   const { detail, directorId, genreIds, ...movieRest } = dto;

    //   const movieUpdateParams: Prisma.MovieUpdateInput = {
    //     ...movieRest,
    //   };
    //   if (directorId) {
    //     const director = await prisma.director.findUnique({
    //       where: {
    //         id: directorId,
    //       },
    //     });
    //     if (!director) {
    //       throw new NotFoundException('존재하지 않는 ID의 감독입니다.');
    //     }
    //     movieUpdateParams.director = {
    //       connect: {
    //         id: director.id,
    //       },
    //     };
    //   }

    //   if (genreIds) {
    //     const genres = await prisma.genre.findMany({
    //       where: {
    //         id: { in: genreIds },
    //       },
    //     });
    //     if (genres.length !== genreIds.length) {
    //       throw new NotFoundException(
    //         `존재하지 않는 장르가 있습니다. 존재하는 ids => ${genres.map((genre) => genre.id).join(',')}`,
    //       );
    //     }
    //     movieUpdateParams.genres = {
    //       set: genres.map((genre) => ({ id: genre.id })),
    //     };
    //   }

    //   await prisma.movie.update({
    //     where: { id },
    //     data: movieUpdateParams,
    //   });

    //   if (detail) {
    //     await prisma.movieDetail.update({
    //       where: { id: movie.detail.id },
    //       data: {
    //         detail,
    //       },
    //     });
    //   }

    //   return prisma.movie.findUnique({
    //     where: { id },
    //     include: {
    //       detail: true,
    //       director: true,
    //       genres: true,
    //     },
    //   });
    // });
  }

  // async update(id: number, dto: UpdateMovieDto) {
  //   const queryRunner = this.dataSource.createQueryRunner();
  //   await queryRunner.connect();
  //   await queryRunner.startTransaction();
  //   try {
  //     const movie = await queryRunner.manager.findOne(Movie, {
  //       where: { id },
  //       relations: ['detail', 'director', 'genres'],
  //     });
  //     if (!movie) {
  //       throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
  //     }
  //     const { detail, directorId, genreIds, ...movieInfo } = dto;
  //     // 감독
  //     let newDirector;
  //     if (directorId) {
  //       const director = await queryRunner.manager.findOne(Director, {
  //         where: { id: directorId },
  //       });
  //       if (!director) {
  //         throw new NotFoundException('존재하지 않는 ID의 감독입니다.');
  //       }
  //       newDirector = director;
  //     }
  //     // 장르
  //     let newGenres;
  //     if (genreIds) {
  //       const genres = await queryRunner.manager.find(Genre, {
  //         where: { id: In(genreIds) },
  //       });
  //       if (genres.length !== genreIds.length) {
  //         throw new NotFoundException(
  //           `존재하지 않는 장르가 있습니다. 존재하는 ids => ${genres.map((genre) => genre.id).join(',')}`,
  //         );
  //       }
  //       newGenres = genres;
  //     }
  //     const movieUpdateFields = {
  //       ...movieInfo,
  //       ...(newDirector && { director: newDirector }),
  //     };
  //     await this.updateMovie(queryRunner, movieUpdateFields, id);

  //     if (detail) {
  //       await this.updateMovieDetail(queryRunner, detail, movie);
  //     }
  //     if (newGenres) {
  //       //Many To Many 관계에서 추가와 제거를 동시에 할 때 사용
  //       await this.updateMovieGenreRelation(queryRunner, id, newGenres, movie);
  //     }
  //     const result = await queryRunner.manager.findOne(Movie, {
  //       where: { id: movie.detail.id },
  //       relations: ['detail', 'director', 'genres'],
  //     });
  //     await queryRunner.commitTransaction();
  //     return result;
  //   } catch (e) {
  //     await queryRunner.rollbackTransaction();
  //     throw e;
  //   } finally {
  //     await queryRunner.release();
  //   }
  // }

  /* istanbul ignore next */
  deleteMovie(id: number) {
    // return this.movieRepository
    //   .createQueryBuilder()
    //   .delete()
    //   .where('id = :id', { id })
    //   .execute();
  }
  async remove(id: number) {
    const movie = await this.movieModel.findById(id).populate('detail').exec();
    // const movie = await this.prisma.movie.findUnique({
    //   where: { id },
    //   include: {
    //     detail: true,
    //   },
    // });
    // const movie = await this.findOne(id);
    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }
    await this.movieModel.findByIdAndDelete(id).exec();
    await this.movieDetailModel.findByIdAndDelete(movie.detail._id).exec();
    // await this.prisma.movie.delete({
    //   where: { id },
    // });
    // await this.deleteMovie(id);

    // if (movie.detail) {
    // await this.prisma.movieDetail.delete({
    //   where: { id: movie.detail.id },
    // });
    // await this.movieDetailRepository.delete(movie.detail.id);
    // }
    return id;
  }

  /* istanbul ignore next */
  getLikedRecord(movieId: number, userId: number) {
    // return this.movieUserLikeRepository
    //   .createQueryBuilder('mul')
    //   .leftJoinAndSelect('mul.movie', 'movie')
    //   .leftJoinAndSelect('mul.user', 'user')
    //   .where('movie.id = :movieId', { movieId })
    //   .andWhere('user.id = :userId', { userId })
    //   .getOne();
  }

  async toggleMovieLike(movieId: number, userId: number, isLike: boolean) {
    const movie = await this.movieModel.findById(movieId).exec();
    // const movie = await this.prisma.movie.findUnique({
    //   where: {
    //     id: movieId,
    //   },
    // });
    // const movie = await this.movieRepository.findOne({
    //   where: {
    //     id: movieId,
    //   },
    // });
    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }
    const user = await this.userModel.findById(userId).exec();
    // const user = await this.prisma.user.findUnique({
    //   where: {
    //     id: userId,
    //   },
    // });
    // const user = await this.userRepository.findOne({
    //   where: {
    //     id: userId,
    //   },
    // });
    if (!user) {
      throw new UnauthorizedException('존재하지 않는 ID의 유저입니다.');
    }

    const likeRecord = await this.movieUserLikeModel.findOne({
      movie: movieId,
      user: userId,
    });
    // const likeRecord = await this.prisma.movieUserLike.findUnique({
    //   where: {
    //     movieId_userId: {
    //       movieId,
    //       userId,
    //     },
    //   },
    // });
    // const likeRecord = await this.getLikedRecord(movieId, userId);

    if (!likeRecord) {
      await this.movieUserLikeModel.create({
        movie: movieId,
        user: userId,
        isLike,
      });
      // await this.prisma.movieUserLike.create({
      //   data: {
      //     movie: {
      //       connect: {
      //         id: movieId,
      //       },
      //     },
      //     user: {
      //       connect: {
      //         id: userId,
      //       },
      //     },
      //     isLike,
      //   },
      // });
      // await this.movieUserLikeRepository.save({
      //   movie,
      //   user,
      //   isLike,
      // });
    }
    if (likeRecord && likeRecord.isLike === isLike) {
      await this.movieUserLikeModel.findByIdAndDelete(likeRecord._id).exec();
      // await this.prisma.movieUserLike.delete({
      //   where: {
      //     movieId_userId: {
      //       movieId,
      //       userId,
      //     },
      //   },
      // });
      // await this.movieUserLikeRepository.delete({
      //   movie,
      //   user,
      // });
    } else {
      likeRecord.isLike = isLike;
      await likeRecord.save();
      // await this.movieUserLikeModel.findByIdAndUpdate(likeRecord._id, {
      //   isLike,
      // });
      // await this.prisma.movieUserLike.update({
      //   where: {
      //     movieId_userId: {
      //       movieId,
      //       userId,
      //     },
      //   },
      //   data: {
      //     isLike,
      //   },
      // });
      // await this.movieUserLikeRepository.update(
      //   {
      //     movie,
      //     user,
      //   },
      //   {
      //     isLike,
      //   },
      // );
    }

    const result = await this.movieUserLikeModel.findOne({
      movie: movieId,
      user: userId,
    });
    // const result = await this.prisma.movieUserLike.findUnique({
    //   where: {
    //     movieId_userId: {
    //       movieId,
    //       userId,
    //     },
    //   },
    // });
    // const result = await this.getLikedRecord(movieId, userId);
    return {
      isLike: result && result.isLike,
    };
  }
}
