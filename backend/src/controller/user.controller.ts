import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '@/auth/current-user-decorator';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CreateUserDTO, LoginUserDTO, UpdateUserDTO } from '@/contracts/user.dto';
import { EnvService } from '@/env/env.service';
import { UserService } from '@/service/user.service';


@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService, private config: EnvService) { }

  @Post('register')
  create(@Body() createUserDto: CreateUserDTO) {
    return this.userService.create(createUserDto);
  }

  @Post("login")
  login(@Body() user: LoginUserDTO) {
    return this.userService.login(user)
  }

  @Post('register-oauth')
  async registerOAuthUser(@Body() user: CreateUserDTO) {
    return this.userService.finishregisterOAuthUser(user);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) { }


  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res() res: any) {
    const userProfile = req.user as { email: string; name: string };

    const result = await this.userService.oauthLogin({
      email: userProfile.email,
      name: userProfile.name,
    });

    // Redireciona com o token
    res.redirect(`${this.config.get('URL_FRONTEND')}/?token=${result.token}`);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: { sub: string }) {
    return this.userService.findAll(user);
  }

  @Get('/me')
  @UseGuards(JwtAuthGuard)
  findOne(@CurrentUser() user: { sub: string }) {
    return this.userService.findOne(user);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDTO) {
  //   return this.userService.update(id, updateUserDto);
  // }

  @Delete()
  @UseGuards(JwtAuthGuard)
  remove(@CurrentUser() user: { sub: string }) {
    return this.userService.removeUser(user);
  }
}
