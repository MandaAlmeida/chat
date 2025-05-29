import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './service/prisma.service';
import { EnvService } from './env/env.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);
  const envService = app.get(EnvService)
  app.enableCors({
    origin: '*',  // ou '*' se quiser liberar geral (não recomendado para produção)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });
  const port = envService.get("PORT")
  await app.listen(port);
}
bootstrap();
