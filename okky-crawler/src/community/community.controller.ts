import { Controller, Get } from '@nestjs/common';

@Controller('community')
export class CommunityController {
  @Get()
  getCommunity() {}
}
