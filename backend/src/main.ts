import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './service/prisma.service';
import { EnvService } from './env/env.service';
import { CustomLogger } from './logs/custom.logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);
  const envService = app.get(EnvService);

  app.enableCors({
    origin: envService.get("URL_FRONTEND"),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  // Config Logger
  app.useLogger(app.get(CustomLogger));

  const port = envService.get("PORT")
  await app.listen(port);
}
bootstrap();
