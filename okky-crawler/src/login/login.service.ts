import { Injectable, Logger } from '@nestjs/common';
import puppeteer, { Page } from 'puppeteer';
import { OKKY_LOGIN_URL } from 'src/constants/url';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoginService {
  private readonly logger = new Logger(LoginService.name);
  constructor(private readonly configService: ConfigService) {}

  async login(): Promise<Page> {
    try {
      const browser = await puppeteer.launch({ headless: false });
      const page = await browser.newPage();

      await page.goto(OKKY_LOGIN_URL);
      await page.type('#user-id', this.configService.get('app.okky_id'));
      await page.type('#password', this.configService.get('app.okky_password'));
      await page.click('button[type="submit"]');
      return page;
    } catch (e) {
      this.logger.error('로그인 중 에러 발생', e);
      throw e;
    }
  }
}
