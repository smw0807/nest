import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import * as cheerio from 'cheerio';

@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);
  constructor(private readonly httpService: HttpService) {}

  async crawl() {
    const url = 'https://okky.kr/community/';
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(url, { responseType: 'text' }),
      );
      const $ = cheerio.load(data);

      console.log($);
    } catch (e) {
      this.logger.error('크롤링 중 에러 발생', e);
      throw e;
    }
  }
}
