import { createParamDecorator, ExecutionContext } from "@nestjs/common";


// Criado current como as que existe @Body, @Request,..., para limitar o que sera retornado
export const CurrentUser = createParamDecorator((_: never, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest()

    return request.user;
}) 