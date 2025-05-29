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
    message: string
}