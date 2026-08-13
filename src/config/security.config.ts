import { registerAs } from '@nestjs/config';

export default registerAs('security', () => ({
  internalSecret: process.env.CHATBOT_INTERNAL_SECRET ?? '',
}));
