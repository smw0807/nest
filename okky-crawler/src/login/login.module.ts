import { Module } from '@nestjs/common';
import { LoginService } from './login.service';
import { ConfigModule } from 'src/config/config.module';
@Module({
  imports: [ConfigModule],
  providers: [LoginService],
  exports: [LoginService],
})
export class LoginModule {}
