import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { OKKY_COMMUNITY_URL } from '../constants/url';
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);
  constructor(private readonly httpService: HttpService) {}

  async crawl() {
    try {
      const browser = await puppeteer.launch({ headless: false });
      const page = await browser.newPage();
      await page.goto(OKKY_COMMUNITY_URL);
      // const content = await page.content();
      // const $ = cheerio.load(content);
      // const test = await page.$('result');
      // console.log(test);

      // page.on('request', (request) => {
      //   console.log(request.url());
      // });

      // page.on('response', (response) => {
      //   console.log(response.url());
      // });
    } catch (e) {
      this.logger.error('크롤링 중 에러 발생', e);
      throw e;
    }
  }
}
