import 'dotenv/config';
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
    throw new Error('❌ Variável REDIS_URL não definida no .env');
}

const redis = new Redis(redisUrl);

(async () => {
    try {
        const keys = await redis.keys('*');
        console.log('🔑 Chaves existentes no Redis:', keys);
    } catch (err) {
        console.error('❌ Erro ao buscar chaves do Redis:', err);
    } finally {
        redis.disconnect();
    }
})();
