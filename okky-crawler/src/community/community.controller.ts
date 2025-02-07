import { Controller, Get, Logger, Res } from '@nestjs/common';
import { CommunityService } from './community.service';
import { Response } from 'express';
import { LoginService } from 'src/login/login.service';

@Controller('community')
export class CommunityController {
  private readonly logger = new Logger(CommunityController.name);
  constructor(
    private readonly communityService: CommunityService,
    private readonly loginService: LoginService,
  ) {}

  @Get()
  async getCommunity(@Res() res: Response) {
    try {
      const page = await this.loginService.login();
      await this.communityService.crawl(page);
      res.send('success');
    } catch (e) {
      this.logger.error('커뮤니티 크롤링 중 에러 발생', e);
      throw e;
    }
  }
}
