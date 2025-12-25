import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin:
      process.env.FRONTEND_URL?.split(',').map((item) => item.trim()) || '*',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Truong Thanh API')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    swaggerOptions: { persistAuthorization: true },
  });

  // Redirect trang gốc sang Swagger UI cho tiện mở nhanh
  const server = app.getHttpAdapter().getInstance();
  server.get('/', (_req, res) => res.redirect('/api/docs'));

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  const logger = new Logger('Bootstrap');
  logger.log(`Swagger UI: http://localhost:${port}/api/docs`);
  logger.log(`OpenAPI JSON: http://localhost:${port}/api-json`);
  logger.log(`Root redirect: http://localhost:${port}/`);
}
bootstrap();
