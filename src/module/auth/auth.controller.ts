import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Public } from './decorators/public.decorator'; // vou te dar esse decorator no final (pra liberar rotas sem JWT)

// DTOs de resposta pra deixar o Swagger LINDO
class AuthResponseDto {
  access_token: string;
  expires_in: number;
  user: {
    id: number;
    email: string;
    name?: string;
  };
}

class ErrorResponseDto {
  statusCode: number;
  message: string[];
  error: string;
}

@ApiTags('auth')
@ApiBearerAuth('JWT-auth') // aparece o cadeado + botão Authorize global
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  // ==================== REGISTER ====================
  @Post('register')
  @Public() // libera essa rota do guard JWT (crie o decorator abaixo)
  @ApiOperation({
    summary: 'Criar nova conta de usuário',
    description: 'Registra um novo usuário com email único. Retorna JWT + dados do usuário.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({
    description: 'Usuário criado com sucesso!',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxx',
        expires_in: 3600,
        user: {
          id: 42,
          email: 'isaac.bunga@outlook.com',
          name: 'Isaac Isvaldo',
        },
      },
    },
  })
  @ApiConflictResponse({
    description: 'E-mail já cadastrado',
    type: ErrorResponseDto,
  })
  async register(@Body() dto: RegisterDto) {
    return this.auth.register(dto.email, dto.password, dto.name);
  }

  // ==================== LOGIN ====================
  @Post('login')
  @Public() // libera do JWT
  @ApiOperation({
    summary: 'Login com email e senha',
    description: 'Autentica usuário e retorna JWT válido por 1h (ou o que você configurar).',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Login realizado com sucesso!',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Credenciais inválidas',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized',
      },
    },
  })
  async login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }
}