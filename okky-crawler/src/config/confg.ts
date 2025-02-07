import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  okky_id: process.env.OKKY_ID,
  okky_password: process.env.OKKY_PASSWORD,
}));
