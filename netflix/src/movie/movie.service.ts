import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entitie/director.entity';

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
    // private readonly directorService: DirectorService,
  ) {}

  findAll(name: string) {
    return this.movieRepository.findAndCount({
      where: {
        name: name ? ILike(`%${name}%`) : undefined,
      },
    });
  }

  findOne(id: number) {
    const movie = this.movieRepository.findOne({
      where: { id },
      relations: ['detail', 'director'],
    });
    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }
    return movie;
  }

  async create(dto: CreateMovieDto) {
    const { directorId, detail, ...movieInfo } = dto;
    // const director = await this.directorService.findOne(directorId);
    const director = await this.directorRepository.findOne({
      where: { id: directorId },
    });
    if (!director) {
      throw new NotFoundException('존재하지 않는 ID의 감독입니다.');
    }
    // cascade: true 옵션을 주면 영화 상세 정보를 생성할 때 영화 정보도 함께 생성된다.
    const movie = await this.movieRepository.save({
      ...movieInfo,
      detail: {
        detail: detail,
      },
      director: {
        id: directorId,
      },
    });
    return movie;
  }

  async update(id: number, dto: UpdateMovieDto) {
    const movie = await this.findOne(id);
    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }
    const { detail, directorId, ...movieInfo } = dto;
    let newDirector;
    if (directorId) {
      const director = await this.directorRepository.findOne({
        where: { id: directorId },
      });
      if (!director) {
        throw new NotFoundException('존재하지 않는 ID의 감독입니다.');
      }
      newDirector = director;
    }
    await this.movieRepository.update(id, {
      ...movieInfo,
      ...(newDirector && { director: newDirector }),
    });
    if (detail) {
      await this.movieDetailRepository.update(movie.detail.id, { detail });
    }
    return this.findOne(id);
  }

  async remove(id: number) {
    const movie = await this.findOne(id);
    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }
    await this.movieRepository.delete(id);
    if (movie.detail) {
      await this.movieDetailRepository.delete(movie.detail.id);
    }
    return id;
  }
}
