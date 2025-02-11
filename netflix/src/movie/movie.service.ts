import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

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
export interface Movie {
  id?: number;
  name: string;
  description: string;
  rating: number;
  year: number;
  genre: string;
  director: string;
  cast: string[];
}
@Injectable()
export class MovieService {
  private movies: Movie[] = [
    {
      id: 1,
      name: 'The Shawshank Redemption',
      description:
        'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
      rating: 9.3,
      year: 1994,
      genre: 'Drama',
      director: 'Frank Darabont',
      cast: ['Tim Robbins', 'Morgan Freeman', 'Bob Gunton'],
    },
    {
      id: 2,
      name: 'The Godfather',
      description:
        'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.',
      rating: 9.2,
      year: 1972,
      genre: 'Crime, Drama',
      director: 'Francis Ford Coppola',
      cast: ['Marlon Brando', 'Al Paccino', 'James Caan'],
    },
  ];
  private idCounter = 3;

  getManyMovies(name: string) {
    if (!name) {
      return this.movies;
    }
    return this.movies.filter((movie) => movie.name.includes(name));
  }

  getMovieById(id: number) {
    const movie = this.movies.find((movie) => movie.id === +id);
    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }
    return movie;
  }

  createMovie(movie: CreateMovieDto) {
    const newMovie = {
      id: this.idCounter++,
      ...movie,
    };
    this.movies.push(newMovie);
    return newMovie;
  }

  updateMovie(id: number, movie: UpdateMovieDto) {
    const movieIndex = this.movies.findIndex((movie) => movie.id === +id);
    if (movieIndex === -1) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }
    Object.assign(this.movies[movieIndex], movie);
    return this.movies[movieIndex];
  }

  deleteMovie(id: number) {
    const movieIndex = this.movies.findIndex((movie) => movie.id === +id);
    if (movieIndex === -1) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }
    this.movies.splice(movieIndex, 1);
    return id;
  }
}
