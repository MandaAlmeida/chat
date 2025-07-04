import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { JwtStrategy } from "./jwt.strategy";
import { EnvService } from "@/env/env.service";
import { EnvModule } from "@/env/env.module";
import { PrismaModule } from "@/module/prisma.module";
import { GoogleStrategy } from "./google.strategy";
import { ConfigModule } from "@nestjs/config";
import { RefreshTokenStrategy } from "./refresh-token.strategy";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";


@Module({
    imports: [
        PassportModule,
        JwtModule.registerAsync({
            imports: [EnvModule],
            inject: [EnvService],
            global: true,
            useFactory: (env: EnvService) => {
                const privateKeyString = env.get("JWT_PRIVATE_KEY") || "";
                const publicKeyString = env.get("JWT_PUBLIC_KEY") || "";


                return {
                    privateKey: Buffer.from(privateKeyString, "base64"),
                    publicKey: Buffer.from(publicKeyString, "base64"),
                    signOptions: {
                        algorithm: "RS256",
                    },
                };
            }
        }),
        PrismaModule,
        EnvModule
    ],
    controllers: [AuthController],
    providers: [JwtStrategy, GoogleStrategy, RefreshTokenStrategy, AuthService],
    exports: [JwtModule, PassportModule, GoogleStrategy, RefreshTokenStrategy, AuthService],
})

export class AuthModule { }