import { Module } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [HttpModule, AuthModule],
  controllers: [CommunityController],
  providers: [CommunityService],
})
export class CommunityModule {}
