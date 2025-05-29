import { INestApplication, OnModuleDestroy, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {

    // Configura o Prisma para mostrar apenas avisos e erros no log
    constructor() {
        super({
            log: ['warn', 'error'],
        });
    }

    // Quando o módulo for encerrado, desconecta do banco de dados
    async onModuleDestroy() {
        await this.$disconnect();
    }

    // Configura ações para quando a aplicação for encerrada (Ctrl+C ou SIGTERM)
    async enableShutdownHooks(app: INestApplication) {
        // Ao receber o sinal SIGINT (Ctrl+C), fecha a app e encerra o processo
        process.on('SIGINT', async () => {
            await app.close();
            process.exit(0);
        });

        // Ao receber o sinal SIGTERM, fecha a app e encerra o processo
        process.on('SIGTERM', async () => {
            await app.close();
            process.exit(0);
        });
    }
}

