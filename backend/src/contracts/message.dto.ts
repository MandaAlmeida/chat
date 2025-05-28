import { IsBoolean, IsString } from "class-validator"


export class CreateMessageDTO {
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