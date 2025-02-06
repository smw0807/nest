import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import * as cheerio from 'cheerio';
import { OKKY_COMMUNITY_URL } from '../constants/url';

@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);
  constructor(private readonly httpService: HttpService) {}

  async crawl() {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(OKKY_COMMUNITY_URL, { responseType: 'text' }),
      );
      const $ = cheerio.load(data);

      console.log($);
    } catch (e) {
      this.logger.error('크롤링 중 에러 발생', e);
      throw e;
    }
  }
}
