import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { mkdirSync } from 'fs';
import { AppModule } from './app.module';
import { validationPipe } from './common/validation';
import { uploadRoot } from './modules/uploads/upload.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.set('trust proxy', true);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(validationPipe());

  const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins, credentials: true });

  // Tệp tải lên được phục vụ tĩnh tại /uploads/... (web và app di động dùng chung đường dẫn)
  mkdirSync(uploadRoot(), { recursive: true });
  app.useStaticAssets(uploadRoot(), { prefix: '/uploads/', maxAge: '7d', index: false });

  const config = new DocumentBuilder()
    .setTitle('API Trường THPT Lê Quý Đôn – Hà Đông')
    .setDescription('REST API dùng chung cho website và ứng dụng di động. Các route /admin/* cần Bearer token.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, () => SwaggerModule.createDocument(app, config));

  app.enableShutdownHooks();
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  Logger.log(`API: http://localhost:${port}/api/v1 · Tài liệu: http://localhost:${port}/docs`, 'Bootstrap');
}

void bootstrap();
