import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { v4 } from 'uuid';
import { rename } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class MovieFilePipe
  implements PipeTransform<Express.Multer.File, Promise<Express.Multer.File>>
{
  constructor(
    private readonly options: {
      maxSize: number;
      mimetype: string;
    },
  ) {}
  async transform(
    value: Express.Multer.File,
    metadata: ArgumentMetadata,
  ): Promise<Express.Multer.File> {
    if (!value) {
      throw new BadRequestException('movie 필드는 필수 입니다.');
    }
    const bytesSize = this.options.maxSize * 1000000;
    if (value.size > bytesSize) {
      throw new BadRequestException(
        `movie 필드의 크기는 최대 ${this.options.maxSize}MB 입니다.`,
      );
    }
    if (value.mimetype !== this.options.mimetype) {
      throw new BadRequestException(
        `movie 필드는 ${this.options.mimetype} 파일만 업로드 가능합니다.`,
      );
    }
    const split = value.originalname.split('.');
    let extension = 'mp4';
    if (split.length > 1) {
      extension = split[split.length - 1];
    }
    const filename = `${v4()}_${Date.now()}.${extension}`;
    const newPath = join(value.destination, filename);

    await rename(value.path, newPath);
    return {
      ...value,
      filename,
      path: newPath,
    };
  }
}
