import { Module } from '@nestjs/common';
import appConfig from './confg';
import { validationSchema } from './validation.schema';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
@Module({
  imports: [
    NestConfigModule.forRoot({
      envFilePath: '.env',
      load: [appConfig],
      isGlobal: true,
      validationSchema,
    }),
  ],
})
export class ConfigModule {}
