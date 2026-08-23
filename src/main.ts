import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('SpaceHubBootstrap');
  const app = await NestFactory.create(AppModule);

  // GRC: Helmet para Headers HTTP Seguros
  app.use(helmet());

  // CORS configurado dinamicamente para aceitar a URL de produção (Vercel) ou todas localmente (dev)
  const allowedOrigins = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',') 
    : true; // <-- Mudado para true para evitar problemas com portas (como a 8080) no desenvolvimento

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Validação Global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Filtro de Exceções Global para mensagens HTTP amigáveis
  app.useGlobalFilters(new HttpExceptionFilter());

  // Interceptor de Auditoria Global
  app.useGlobalInterceptors(new LoggingInterceptor());

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  logger.log(`🚀 SpaceHub API Backend rodando com sucesso na porta ${port}`);
}

bootstrap();
