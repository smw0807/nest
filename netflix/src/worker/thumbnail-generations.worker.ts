import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { join } from 'path';
import { cwd } from 'process';
import * as ffmpegFluent from 'fluent-ffmpeg';

@Processor('thumbnail-generation')
export class ThumbnailGenerationProcess extends WorkerHost {
  async process(job: Job) {
    const { videoId, videoPath } = job.data;
    // const thumbnailPath = `${videoPath.split('.').slice(0, -1).join('.')}-thumbnail.jpg`;
    console.log(`영상 트랜스코딩중... ID: ${videoId}`);
    const outputDirectory = join(cwd(), 'public', 'thumbnail');

    ffmpegFluent(videoPath)
      .screenshots({
        count: 1,
        filename: `${videoId}.png`,
        folder: outputDirectory,
        size: '320x240',
      })
      .on('end', () => {
        console.log(`썸네일 생성 완료: ${videoId}`);
      })
      .on('error', (err) => {
        console.error(`썸네일 생성 오류: ${videoId}`);
      });

    return 0;
  }
}
