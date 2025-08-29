import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  UseGuards,
  Req,
  Res,
  Logger,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '@/auth/current-user-decorator';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CreateUserDTO, LoginUserDTO } from '@/contracts/user.dto';
import { EnvService } from '@/env/env.service';
import { UserService } from '@/service/user.service';

@Controller('user')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    private readonly userService: UserService,
    private config: EnvService,
  ) {}

  @Post('register')
  async create(@Body() createUserDto: CreateUserDTO) {
    this.logger.error('Error from UserController create');

    return this.userService.create(createUserDto);
  }

  @Post('login')
  async login(@Body() user: LoginUserDTO) {
    this.logger.error('Error from UserController login');
    return this.userService.login(user);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: { sub: string }) {
    this.logger.error('Error from UserController logout');
    return this.userService.logout(user);
  }

  @Post('register-oauth')
  async registerOAuthUser(@Body() user: CreateUserDTO) {
    this.logger.error('Error from UserController registerOAuthUser');

    return this.userService.finishregisterOAuthUser(user);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {}

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res() res: any) {
    this.logger.error('Error from UserController googleAuthRedirect');

    const userProfile = req.user as { email: string; name: string };

    const result = await this.userService.oauthLogin({
      email: userProfile.email,
      name: userProfile.name,
    });

    // Redireciona com o token
    res.redirect(
      `${this.config.get('URL_FRONTEND')}/?token=${result.access_token}`,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @CurrentUser() user: { sub: string },
    @Query('search') search: string,
  ) {
    this.logger.error('Error from UserController findAll');

    return this.userService.findUsers(user, search);
  }

  @Get('/me')
  @UseGuards(JwtAuthGuard)
  findOne(@CurrentUser() user: { sub: string }) {
    this.logger.error('Error from UserController findOne');
    return this.userService.findOne(user);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  remove(@CurrentUser() user: { sub: string }) {
    this.logger.error('Error from UserController remove');
    return this.userService.removeUser(user);
  }
}
