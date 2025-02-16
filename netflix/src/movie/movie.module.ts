import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from './entity/movie.entity';
import { MovieDetail } from './entity/movie-detail.entity';
import { DirectorModule } from 'src/director/director.module';
import { Director } from 'src/director/entitie/director.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Movie, MovieDetail, Director]),
    DirectorModule,
  ],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
