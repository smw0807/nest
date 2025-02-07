import { Module } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { HttpModule } from '@nestjs/axios';
import { LoginModule } from 'src/login/login.module';

@Module({
  imports: [HttpModule, LoginModule],
  controllers: [CommunityController],
  providers: [CommunityService],
})
export class CommunityModule {}
