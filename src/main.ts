import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT) || 3100;
  await app.listen(port);
  console.log(`Chatbot service listening on port ${port}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start chatbot service:', err);
  process.exit(1);
});
