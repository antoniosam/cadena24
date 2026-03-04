import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse, ITokenPayload, ITokenUser } from '@cadena24-wms/shared';
import { AuthService } from './auth.service';
import { LoginDto } from './dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { RefreshAuthGuard } from './guards/refresh-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiResponse<ITokenUser>> {
    const user = await this.authService.validateUser(dto.email, dto.password);

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const tokenUser = await this.authService.login(user, res);

    return {
      success: true,
      message: 'Sesión iniciada correctamente',
      data: tokenUser,
      timestamp: new Date().toISOString(),
    };
  }

  @UseGuards(RefreshAuthGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @CurrentUser() user: { sub: number; refreshToken: string },
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiResponse<ITokenUser>> {
    const tokenUser = await this.authService.refresh(user.sub, user.refreshToken, res);

    return {
      success: true,
      message: 'Sesión renovada correctamente',
      data: tokenUser,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: ITokenPayload,
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiResponse<null>> {
    await this.authService.logout(user.sub, res);

    return {
      success: true,
      message: 'Sesión cerrada correctamente',
      data: null,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('me')
  async me(@CurrentUser() user: ITokenPayload): Promise<ApiResponse<ITokenUser>> {
    const tokenUser = await this.authService.me(user.sub);

    return {
      success: true,
      message: 'Usuario obtenido correctamente',
      data: tokenUser,
      timestamp: new Date().toISOString(),
    };
  }
}
