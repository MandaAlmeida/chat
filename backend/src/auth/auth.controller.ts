import { Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthGuard } from "@nestjs/passport";
import { CurrentUser } from "./current-user-decorator";

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    // auth.controller.ts
    @Get('refresh')
    @UseGuards(AuthGuard("jwt-refresh"))
    async refresh(@CurrentUser() user: { sub: string }) {
        const userId = user.sub;
        console.log(userId)
        return this.authService.generateTokens(userId);
    }
}