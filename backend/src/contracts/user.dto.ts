// import { ApiProperty } from "@nestjs/swagger";
import {
    IsArray,
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsStrongPassword,
} from "class-validator";

export class CreateUserDTO {
    @IsString()
    userName: string;

    @IsNotEmpty({ message: "O nome é obrigatório." })
    @IsString()
    name: string;

    @IsNotEmpty({ message: "O e-mail é obrigatório." })
    @IsEmail({}, { message: "E-mail inválido." })
    email: string;

    @IsString()
    birth: string;

    @IsStrongPassword(
        {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
        },
        {
            message:
                "A senha precisa ter no mínimo 8 caracteres, com letra maiúscula, minúscula, número e símbolo.",
        }
    )
    password: string;


    @IsString()
    passwordConfirmation: string;

    @IsOptional()
    @IsString()
    provider: string
}

export class LoginUserDTO {
    @IsNotEmpty({ message: "O e-mail é obrigatório." })
    @IsEmail({}, { message: "E-mail inválido." })
    email: string;

    @IsNotEmpty({ message: "A senha é obrigatória." })
    @IsString()
    password: string;
}

export class UpdateUserDTO {
    @IsOptional()
    @IsString()
    userName?: string;

    @IsOptional()
    @IsString()
    name: string;

    @IsOptional()
    @IsEmail({}, { message: "E-mail inválido." })
    email: string;

    @IsOptional()
    @IsString()
    birth?: string;

    @IsOptional()
    @IsStrongPassword(
        {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
        },
        {
            message:
                "A senha precisa ter no mínimo 8 caracteres, com letra maiúscula, minúscula, número e símbolo.",
        }
    )
    password: string;

    @IsOptional()
    @IsString()
    passwordConfirmation: string;

    @IsOptional()
    @IsString()
    provider: string
}