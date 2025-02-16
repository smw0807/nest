import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';

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
  ) {}

  getManyMovies(name: string) {
    return this.movieRepository.findAndCount({
      where: {
        name: name ? ILike(`%${name}%`) : undefined,
      },
    });
  }

  getMovieById(id: number) {
    const movie = this.movieRepository.findOne({
      where: { id },
      relations: ['detail'],
    });
    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }
    return movie;
  }

  async createMovie(dto: CreateMovieDto) {
    // cascade: true 옵션을 주면 영화 상세 정보를 생성할 때 영화 정보도 함께 생성된다.
    const movie = await this.movieRepository.save({
      ...dto,
      detail: {
        detail: dto.detail,
      },
    });
    return movie;
    // const movieDetail = await this.movieDetailRepository.save({
    //   detail: dto.detail,
    // });
    // const movieInfo = await this.movieRepository.save({
    //   ...dto,
    //   detail: movieDetail,
    // });
    // return movieInfo;
  }

  async updateMovie(id: number, dto: UpdateMovieDto) {
    const movie = await this.getMovieById(id);
    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }
    const { detail, ...movieInfo } = dto;
    await this.movieRepository.update(id, movieInfo);
    if (detail) {
      await this.movieDetailRepository.update(movie.detail.id, { detail });
    }
    return this.getMovieById(id);
  }

  async deleteMovie(id: number) {
    const movie = await this.getMovieById(id);
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
