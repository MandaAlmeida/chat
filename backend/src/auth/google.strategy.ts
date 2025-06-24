import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { EnvService } from '@/env/env.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        config: EnvService,
    ) {
        super({
            clientID: config.get('CLIENT_ID_GOOGLE'),
            clientSecret: config.get('CLIENT_SECRET_GOOGLE'),
            callbackURL: config.get('URL_GOOGLE'),
            scope: ['email', 'profile'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: VerifyCallback
    ) {
        const { emails, name } = profile;

        done(null, {
            email: emails[0].value,
            name: name.givenName,
        });
    }


}
