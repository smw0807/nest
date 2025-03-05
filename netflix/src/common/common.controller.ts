import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('common')
export class CommonController {
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
  createVideo(@UploadedFile() movie: Express.Multer.File) {
    return {
      filename: movie.filename,
    };
  }
}
