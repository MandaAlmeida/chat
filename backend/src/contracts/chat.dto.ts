import { IsArray, IsString } from "class-validator"


export class CreateChatDTO {
    @IsString()
    name: string

    @IsArray()
    participants: string[]
}

export class UpdateGroupChatDTO {
    @IsString()
    id: string

    @IsString()
    name: string

    @IsArray()
    participants: string[]
}