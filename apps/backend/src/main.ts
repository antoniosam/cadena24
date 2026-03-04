import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const isProd = process.env['NODE_ENV'] === 'production';

  const app = await NestFactory.create(AppModule, {
    logger: isProd ? ['error', 'warn', 'log'] : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Cookie parser middleware (needed for HTTP-only cookie auth)
  app.use(cookieParser());

  // Global prefix
  app.setGlobalPrefix('api');

  // Enable CORS only in development (in production, frontend is served by NestJS itself)
  if (!isProd) {
    app.enableCors({
      origin: ['http://localhost:4200', 'http://localhost:4300'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true,
    });
  }

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = process.env['PORT'] || 3000;
  await app.listen(port);

  logger.log(`🚀 Backend running on: http://localhost:${port}/api`);
  logger.log(`🏥 Health check: http://localhost:${port}/api/health`);
  logger.log(`📊 Environment: ${process.env['NODE_ENV'] || 'development'}`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});
