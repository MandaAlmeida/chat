import { INestApplication, OnModuleDestroy, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
    constructor() {
        super({
            log: ['query', 'info', 'warn', 'error'],
        });
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }

    async enableShutdownHooks(app: INestApplication) {
        process.on('SIGINT', async () => {
            await app.close();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            await app.close();
            process.exit(0);
        });
    }
}
