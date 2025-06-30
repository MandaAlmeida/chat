import { Module } from '@nestjs/common';
import { UserController } from '@/controller/user.controller';
import { UserService } from '@/service/user.service';
import { PrismaModule } from './prisma.module';
import { AuthModule } from '@/auth/auth.module';
import { EnvModule } from '@/env/env.module';
import { CacheModule } from '@nestjs/cache-manager';
import { EnvService } from '@/env/env.service';

import * as redisStore from 'cache-manager-ioredis';


@Module({
  imports: [PrismaModule,
    AuthModule,
    EnvModule,
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [EnvModule],
      inject: [EnvService],
      useFactory: async (env: EnvService) => ({
        store: redisStore,
        url: env.get("REDIS_URL"),
        ttl: 60,
      }),
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule { }
