import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConfigModule } from 'src/config/config.module';
@Module({
  imports: [ConfigModule],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
