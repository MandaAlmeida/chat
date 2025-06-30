import { EnvService } from "@/env/env.service";
import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private envService: EnvService
    ) { }

    async generateTokens(userId: string) {
        const payload = { sub: userId };

        const privateKey = Buffer.from(
            this.envService.get('JWT_PRIVATE_KEY'),
            'base64'
        ).toString('utf-8');

        const refreshPrivateKey = Buffer.from(
            this.envService.get('JWT_REFRESH_PRIVATE_KEY'),
            'base64'
        ).toString('utf-8');


        const access_token = await this.jwtService.signAsync(payload, {
            privateKey,
            algorithm: 'RS256',
            expiresIn: '15s',
        });

        const refresh_token = await this.jwtService.signAsync(payload, {
            privateKey: refreshPrivateKey,
            algorithm: 'RS256',
            expiresIn: '7d',
        });

        return { access_token, refresh_token };
    }

    async refreshToken(userId: string) {
        return this.generateTokens(userId);
    }
}