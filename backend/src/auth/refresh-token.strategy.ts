import { EnvService } from "@/env/env.service";
import { Injectable } from "@nestjs/common";
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(config: EnvService) {
        const publicKey = config.get("JWT_REFRESH_PUBLIC_KEY");
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: Buffer.from(publicKey, "base64"),
            algorithms: ["RS256"],
            passReqToCallback: false
        });
    }

    async validate(payload: any) {
        return payload;
    }
}