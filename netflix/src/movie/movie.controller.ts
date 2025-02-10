import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { Movie, MovieService } from './movie.service';

@Controller('movie')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  getMovies(@Query('name') name: string) {
    return this.movieService.getManyMovies(name);
  }

  @Get(':id')
  getMovie(@Param('id') id: string) {
    return this.movieService.getMovieById(+id);
  }

  @Post()
  postMovie(@Body() movie: Movie) {
    return this.movieService.createMovie(movie);
  }

  @Patch(':id')
  patchMovie(@Param('id') id: string, @Body() movie: Movie) {
    return this.movieService.updateMovie(+id, movie);
  }

  @Delete(':id')
  deleteMovie(@Param('id') id: string) {
    return this.movieService.deleteMovie(+id);
  }
}
