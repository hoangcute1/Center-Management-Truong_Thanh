import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin:
      process.env.FRONTEND_URL?.split(',').map((item) => item.trim()) || '*',
  });

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
}
bootstrap();
