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
  // ClassSerializerInterceptor,
  // ParseIntPipe,
  UseGuards,
  // Version,
  Req,
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
// import { Role } from 'src/user/entities/user.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
// import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { UserId } from 'src/user/decorator/user-id.decorator';
// import { QueryRunner } from 'src/common/decorator/query-runner.decorator';
// import { QueryRunner as QR } from 'typeorm';
import {
  CacheKey,
  CacheTTL,
  CacheInterceptor as CI,
} from '@nestjs/cache-manager';
import { Throttle } from 'src/common/decorator/throttlw.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Role } from '@prisma/client';

@ApiBearerAuth()
@Controller({
  path: 'movie',
  // version: '1',
})
// @UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Public()
  @Get()
  @Throttle({
    count: 5,
    unit: 'minute',
  })
  @ApiOperation({
    summary: '영화 목록 조회',
    description: '영화 목록을 조회합니다.',
    operationId: 'getMovies',
  })
  @ApiResponse({
    status: 200,
    description: '영화 목록 조회 성공',
  })
  getMovies(@Query() dto: GetMoviesDto, @UserId() userId?: number) {
    return this.movieService.findAll(dto, userId);
  }

  // @Version('5')
  @Get('recent')
  @UseInterceptors(CI)
  @CacheKey('getMoviesRecent')
  @CacheTTL(3000)
  getMoviesRecent() {
    return this.movieService.findRecent();
  }

  @Public()
  @Get(':id')
  getMovie(@Param('id') id: string, @Req() request: any) {
    const session = request.session;
    const movieCount = session.movieCount ?? {};
    request.session.movieCount = {
      ...movieCount,
      [id]: movieCount[id] ? movieCount[id] + 1 : 1,
    };
    console.log(session);
    return this.movieService.findOne(id);
  }

  @RBAC(Role.admin)
  @UseGuards(AuthGuard)
  // @UseInterceptors(TransactionInterceptor)
  @Post()
  postMovie(
    @Body() body: CreateMovieDto,
    // @QueryRunner() queryRunner: QR,
    @UserId() userId: number,
  ) {
    // return this.movieService.create(body, queryRunner, userId);
    return this.movieService.create(body, userId);
  }

  @RBAC(Role.admin)
  @UseGuards(AuthGuard)
  @Patch(':id')
  patchMovie(@Param('id') id: string, @Body() movie: UpdateMovieDto) {
    return this.movieService.update(id, movie);
  }

  @RBAC(Role.admin)
  @UseGuards(AuthGuard)
  @Delete(':id')
  deleteMovie(@Param('id') id: string) {
    return this.movieService.remove(id);
  }

  @Post(':id/like')
  createMovieLike(@Param('id') movieId: string, @UserId() userId: number) {
    return this.movieService.toggleMovieLike(movieId, userId, true);
  }

  @Post(':id/dislike')
  createMovieDislike(@Param('id') movieId: string, @UserId() userId: number) {
    return this.movieService.toggleMovieLike(movieId, userId, false);
  }
}
