import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api');
  const corsOrigins = configService.get<string>('CORS_ORIGINS', 'http://localhost:3000');
  const swaggerEnabled = configService.get<string>('SWAGGER_ENABLED', 'true') === 'true';

  // ─── Security ───────────────────────────────────────────────
  app.use(helmet());
  app.use(compression());

  // ─── CORS ───────────────────────────────────────────────────
  app.enableCors({
    origin: corsOrigins.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  });

  // ─── Global Prefix ──────────────────────────────────────────
  app.setGlobalPrefix(apiPrefix);

  // ─── Versioning ─────────────────────────────────────────────
  app.enableVersioning({ type: VersioningType.URI });

  // ─── Global Pipes ───────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ─── Global Filters ─────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());

  // ─── Global Interceptors ────────────────────────────────────
  app.useGlobalInterceptors(new TransformInterceptor(), new TenantInterceptor());

  // ─── Swagger ────────────────────────────────────────────────
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Noblesse PMS API')
      .setDescription('Hotel Property Management System REST API')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      )
      .addApiKey({ type: 'apiKey', name: 'X-Tenant-ID', in: 'header' }, 'TenantID')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(port);
  console.log(`🏨 Noblesse PMS API running on http://localhost:${port}/${apiPrefix}`);
  if (swaggerEnabled) {
    console.log(`📚 Swagger docs at http://localhost:${port}/${apiPrefix}/docs`);
  }
}

bootstrap();