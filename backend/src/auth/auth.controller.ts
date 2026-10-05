import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  HttpCode,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { LoginDto, RegisterDto } from './auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Iniciar sesión (email/password local)' })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }
    return this.authService.login(user);
  }

  @Post('register')
  @ApiOperation({ summary: 'Registrar nuevo usuario (local)' })
  @ApiResponse({ status: 201, description: 'Usuario registrado' })
  @ApiResponse({ status: 400, description: 'Error en registro' })
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body.email, body.password, body.fullName);
  }

  @Post('supabase/verify')
  @HttpCode(200)
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verificar token de Supabase OAuth' })
  @ApiResponse({ status: 200, description: 'Token válido, usuario sincronizado' })
  async verifySupabaseToken(@Request() req: any) {
    const supabaseUser = req.user;
    let user = await this.authService.findBySupabaseId(supabaseUser.id);

    if (!user) {
      user = await this.authService.createFromSupabase(supabaseUser);
    } else if (user.role !== supabaseUser.role) {
      user = await this.authService.updateRole(user.id, supabaseUser.role);
    }

    return this.authService.login(user);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener usuario actual (JWT local)' })
  @ApiResponse({ status: 200, description: 'Datos del usuario' })
  async me(@Request() req: any) {
    return req.user;
  }

  @Get('me/supabase')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener usuario actual (Supabase JWT)' })
  @ApiResponse({ status: 200, description: 'Datos del usuario desde Supabase' })
  async meSupabase(@Request() req: any) {
    return req.user;
  }
}
