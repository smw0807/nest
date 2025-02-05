import { Controller, Get, Logger } from '@nestjs/common';
import { CommunityService } from './community.service';

@Controller('community')
export class CommunityController {
  private readonly logger = new Logger(CommunityController.name);
  constructor(private readonly communityService: CommunityService) {}

  @Get()
  async getCommunity() {
    try {
      await this.communityService.crawl();
    } catch (e) {
      this.logger.error('커뮤니티 크롤링 중 에러 발생', e);
      throw e;
    }
  }
}
