import { IsArray, IsBoolean, IsString } from "class-validator"


export class CreateMessageDTO {
    @IsArray()
    recipients: string[]

    @IsString()
    message: string

    @IsString()
    chatId: string
}

export class UpdateMessageDTO {
    @IsString()
    id: string

    @IsString()
    message: string
}