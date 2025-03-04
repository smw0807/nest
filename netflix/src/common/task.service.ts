import { Injectable, Logger } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { readdir, unlink } from 'fs/promises';
import { join, parse } from 'path';
import { Movie } from 'src/movie/entity/movie.entity';
import { Repository } from 'typeorm';
import { DefaultLogger } from './logger/default.logger';

@Injectable()
export class TaskService {
  // private readonly logger = new Logger(TaskService.name);
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly logger: DefaultLogger,
  ) {}

  // @Cron('*/5 * * * * *')
  logEverySecond() {
    this.logger.fatal('1초 마다 실행');
    this.logger.error('1초 마다 실행');
    this.logger.warn('1초 마다 실행');
    this.logger.log('1초 마다 실행');
    this.logger.debug('1초 마다 실행');
    this.logger.verbose('1초 마다 실행');
  }

  @Cron('* * * * * *')
  async eraseOrphanFiles() {
    const files = await readdir(join(process.cwd(), 'public', 'temp'));

    const deleteFileTargets = files.filter((file) => {
      const filename = parse(file).name;
      const split = filename.split('_');

      if (split.length !== 2) {
        return true;
      }

      try {
        const date = +new Date(parseInt(split[split.length - 1]));
        const aDayInMilSec = 24 * 60 * 60 * 1000;
        const now = +new Date();
        // 24시간 이상 지난 파일
        return now - date > aDayInMilSec;
      } catch (e) {
        return true;
      }
    });

    await Promise.all(
      deleteFileTargets.map((file) =>
        unlink(join(process.cwd(), 'public', 'temp', file)),
      ),
    );
  }

  // @Cron('0 * * * * *')
  async calculateMovieLikeCount() {
    console.log('영화 좋아요 수 계산');
    await this.movieRepository.query(
      `update movie m
        set "likeCount" = (
          select count(*) from movie_user_like mul
          where m.id = mul."movieId" and mul."isLike" = true
        )`,
    );
    await this.movieRepository.query(
      `update movie m
        set "dislikeCount" = (
          select count(*) from movie_user_like mul
          where m.id = mul."movieId" and mul."isLike" = false
        )`,
    );
  }

  // @Cron('* * * * * *', {
  //   name: 'printer',
  // })
  printer() {
    console.log('print every second');
  }

  // @Cron('*/5 * * * * *')
  stopper() {
    console.log('stop every 5 seconds');
    const job = this.schedulerRegistry.getCronJob('printer');

    // console.log('-------------------');
    // console.log('# Last Date', job.lastDate());
    // console.log('# Next Date', job.nextDate());
    // console.log('# Next Dates', job.nextDates(5));
    // console.log('-------------------');

    if (job.running) {
      job.start();
    } else {
      job.stop();
    }
  }
}
