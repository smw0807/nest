import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommunityModule } from './community/community.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [CommunityModule, AuthModule, ConfigModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
