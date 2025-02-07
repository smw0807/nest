import { Controller, Get, Logger, Res } from '@nestjs/common';
import { CommunityService } from './community.service';
import { Response } from 'express';
import { AuthService } from 'src/auth/auth.service';

@Controller('community')
export class CommunityController {
  private readonly logger = new Logger(CommunityController.name);
  constructor(
    private readonly communityService: CommunityService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  async getCommunity(@Res() res: Response) {
    try {
      await this.authService.login();
      await this.communityService.crawl();
      res.send('success');
    } catch (e) {
      this.logger.error('커뮤니티 크롤링 중 에러 발생', e);
      throw e;
    }
  }
}
