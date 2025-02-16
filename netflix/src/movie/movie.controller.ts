import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
@Controller('movie')
@UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  getMovies(@Query('name') name: string) {
    return this.movieService.findAll(name);
  }

  @Get(':id')
  getMovie(@Param('id') id: string) {
    return this.movieService.findOne(+id);
  }

  @Post()
  postMovie(@Body() movie: CreateMovieDto) {
    return this.movieService.create(movie);
  }

  @Patch(':id')
  patchMovie(@Param('id') id: string, @Body() movie: UpdateMovieDto) {
    return this.movieService.update(+id, movie);
  }

  @Delete(':id')
  deleteMovie(@Param('id') id: string) {
    return this.movieService.remove(+id);
  }
}
