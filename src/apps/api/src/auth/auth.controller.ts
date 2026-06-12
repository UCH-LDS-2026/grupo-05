import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { OwnerRegisterDto } from './dto/owner-register.dto';
import { EmailLoginDto } from './dto/email-login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser, AuthUser } from './current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Player: login/alta por código de invitación. */
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  /** Owner: registro (queda pendiente de validación). */
  @Post('owner/register')
  registerOwner(@Body() dto: OwnerRegisterDto) {
    return this.auth.registerOwner(dto);
  }

  /** Owner: login por email + password. */
  @Post('owner/login')
  loginOwner(@Body() dto: EmailLoginDto) {
    return this.auth.loginOwner(dto);
  }

  /** Admin: login por email + password. */
  @Post('admin/login')
  loginAdmin(@Body() dto: EmailLoginDto) {
    return this.auth.loginAdmin(dto);
  }

  /** Sujeto autenticado actual (cualquier rol). */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return user;
  }
}
