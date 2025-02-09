import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AppService } from './app.service';

interface Movie {
  id?: number;
  name: string;
  description: string;
  rating: number;
  year: number;
  genre: string;
  director: string;
  cast: string[];
}
@Controller('movie')
export class AppController {
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
  constructor(private readonly appService: AppService) {}

  @Get()
  getMovies(@Query('name') name: string) {
    if (!name) {
      return this.movies;
    }
    return this.movies.filter((movie) => movie.name.includes(name));
  }

  @Get(':id')
  getMovie(@Param('id') id: string) {
    const movie = this.movies.find((movie) => movie.id === +id);
    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }
    return movie;
  }

  @Post()
  postMovie(@Body() movie: Movie) {
    const newMovie = {
      id: this.idCounter++,
      ...movie,
    };
    this.movies.push(newMovie);
    return newMovie;
  }

  @Patch(':id')
  patchMovie(@Param('id') id: string, @Body() movie: Movie) {
    const movieIndex = this.movies.findIndex((movie) => movie.id === +id);
    if (movieIndex === -1) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }
    Object.assign(this.movies[movieIndex], movie);
    return this.movies[movieIndex];
  }

  @Delete(':id')
  deleteMovie(@Param('id') id: string) {
    const movieIndex = this.movies.findIndex((movie) => movie.id === +id);
    if (movieIndex === -1) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }
    this.movies.splice(movieIndex, 1);
    return id;
  }
}
