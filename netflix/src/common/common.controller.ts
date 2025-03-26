import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CommonService } from './common.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';

@ApiBearerAuth()
@Controller('common')
export class CommonController {
  constructor(
    private readonly commonService: CommonService,
    @InjectQueue('thumbnail-generation')
    private readonly thumbnailGenerationQueue: Queue,
  ) {}
  @Post('video')
  @UseInterceptors(
    FileInterceptor('movie', {
      limits: {
        fileSize: 20000000,
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'video/mp4') {
          return cb(
            new BadRequestException('mp4 파일만 업로드 가능합니다.'),
            false,
          );
        }
        return cb(null, true);
      },
    }),
  )
  async createVideo(@UploadedFile() movie: Express.Multer.File) {
    await this.thumbnailGenerationQueue.add('thumbnail', {
      videoId: movie.filename,
      videoPath: movie.path,
    });
    return {
      filename: movie.filename,
    };
  }

  @Post('presigned-url')
  async createPresignedUrl() {
    return {
      url: await this.commonService.createPresignedUrl(300),
    };
  }
}
