import { Module } from '@nestjs/common';
import { ThumbnailGenerationProcess } from './thumbnail-generations.worker';

@Module({
  providers: [ThumbnailGenerationProcess],
})
export class WorkerModule {}
