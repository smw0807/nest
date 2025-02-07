import { Injectable, Logger } from '@nestjs/common';
import { OKKY_COMMUNITY_URL } from '../constants/url';
import puppeteer from 'puppeteer';

@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);
  constructor() {}

  async crawl() {
    const browser = await puppeteer.launch({ headless: false });
    try {
      const page = await browser.newPage();
      await page.goto(OKKY_COMMUNITY_URL);
      // const content = await page.content();
      // console.log(content);
      const $ = await page.$$eval('#__next', (elements) => {
        console.log(elements);
      });
      // console.log($);
      // const $ = cheerio.load(content);
      // const articles = $(
      //   '#__next > .relative > .w-full > .min-w-0 > .mb-9 > .divide-y > .py-3.5 > .group',
      // );
      // console.log(articles);

      // const result = Array.from(articles).map((article) => {
      //   console.log(article);
      //   const author = $(article).find('.flex').first().text().trim();
      //   const title = $(article).find('.my-2').text().trim();
      //   return { author, title };
      // });
      // console.log(result);

      // page.on('request', (request) => {
      //   console.log(request.url());
      // });

      // page.on('response', (response) => {
      //   console.log(response.url());
      // });
      await browser.close();
    } catch (e) {
      this.logger.error('크롤링 중 에러 발생', e);
      await browser.close();
      throw e;
    }
  }
}
