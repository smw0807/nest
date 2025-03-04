import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  // app.setGlobalPrefix('v1');
  app.enableVersioning({
    type: VersioningType.URI,
    // defaultVersion: '1',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      // 정의되지 않은 프로퍼티가 있으면 제거함
      whitelist: true,
      // 정의되지 않은 프로퍼티가 있으면 오류 발생
      forbidNonWhitelisted: true,
      // 데이터 타입이 다르면 오류 발생
      transform: true,
      transformOptions: {
        // class에 적혀있는 타입에 맞게 자동으로 변환
        enableImplicitConversion: true,
      },
    }),
  );
  await app.listen(3000);
}
bootstrap();
