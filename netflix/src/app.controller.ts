import {
  Body,
  Controller,
  Delete,
  Get,
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
/**
 * Controller에서는 들어오는 요청에 대한 프로세싱만 진행한다.
 * 비즈니스 로직은 서비스 클래스에 작성한다.
 */
@Controller('movie')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getMovies(@Query('name') name: string) {
    return this.appService.getManyMovies(name);
  }

  @Get(':id')
  getMovie(@Param('id') id: string) {
    return this.appService.getMovieById(+id);
  }

  @Post()
  postMovie(@Body() movie: Movie) {
    return this.appService.createMovie(movie);
  }

  @Patch(':id')
  patchMovie(@Param('id') id: string, @Body() movie: Movie) {
    return this.appService.updateMovie(+id, movie);
  }

  @Delete(':id')
  deleteMovie(@Param('id') id: string) {
    return this.appService.deleteMovie(+id);
  }
}
