import { IsString } from "class-validator";

export class EnvDTO {
    @IsString()
    DATABASE_URL: string

    @IsString()
    REDIS_URL: string

    @IsString()
    PORT: number

    @IsString()
    CLIENT_ID_GOOGLE: string

    @IsString()
    CLIENT_SECRET_GOOGLE: string

    @IsString()
    URL_GOOGLE: string

    @IsString()
    URL_FRONTEND: string

    @IsString()
    JWT_PRIVATE_KEY: string

    @IsString()
    JWT_PUBLIC_KEY: string

    @IsString()
    JWT_REFRESH_PRIVATE_KEY: string

    @IsString()
    JWT_REFRESH_PUBLIC_KEY: string
}