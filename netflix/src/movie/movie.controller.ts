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
  ParseIntPipe,
  Request,
  UseGuards,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { Role } from 'src/user/entities/user.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import {
  FileFieldsInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';

@Controller('movie')
@UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Public()
  @Get()
  getMovies(@Query() dto: GetMoviesDto) {
    return this.movieService.findAll(dto);
  }

  @Public()
  @Get(':id')
  getMovie(@Param('id', ParseIntPipe) id: number) {
    return this.movieService.findOne(id);
  }

  @RBAC(Role.admin)
  @UseGuards(AuthGuard)
  @UseInterceptors(
    TransactionInterceptor,
    FileFieldsInterceptor(
      [
        {
          name: 'movie',
          maxCount: 1,
        },
        {
          name: 'poster',
          maxCount: 2,
        },
      ],
      {
        limits: {
          fileSize: 1024 * 1024 * 20,
        },
        fileFilter: (req, file, cb) => {
          // if (file.mimetype !== 'video/mp4') {
          //   return cb(
          //     new BadRequestException('mp4 파일만 업로드 가능합니다.'),
          //     false,
          //   );
          // }
          return cb(null, true);
        },
      },
    ),
  )
  @Post()
  postMovie(
    @Body() movie: CreateMovieDto,
    @Request() req,
    @UploadedFiles()
    files: {
      movie: Express.Multer.File[];
      poster: Express.Multer.File[];
    },
  ) {
    console.log('--------------------');
    console.log(files);
    return this.movieService.create(movie, req.queryRunner);
  }

  @RBAC(Role.admin)
  @Patch(':id')
  patchMovie(
    @Param('id', ParseIntPipe) id: number,
    @Body() movie: UpdateMovieDto,
  ) {
    return this.movieService.update(id, movie);
  }

  @RBAC(Role.admin)
  @Delete(':id')
  deleteMovie(@Param('id', ParseIntPipe) id: number) {
    return this.movieService.remove(id);
  }
}
