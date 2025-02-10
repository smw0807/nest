import { Controller } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * Controller에서는 들어오는 요청에 대한 프로세싱만 진행한다.
 * 비즈니스 로직은 서비스 클래스에 작성한다.
 */
@Controller('movie')
export class AppController {
  constructor(private readonly appService: AppService) {}
}
