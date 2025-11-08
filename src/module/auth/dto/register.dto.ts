import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength, IsString, IsOptional, MaxLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'E-mail único do usuário (será usado para login)',
    example: 'isaac.bunga@outlook.com',
    format: 'email',
    minLength: 5,
    maxLength: 255,
    uniqueItems: true,
  })
  @IsEmail({}, { message: 'Por favor, informe um e-mail válido' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  @MaxLength(255, { message: 'O e-mail não pode ter mais de 255 caracteres' })
  email: string;

  @ApiProperty({
    description: 'Nome completo ou apelido (opcional)',
    example: 'Isaac Isvaldo',
    required: false,
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'O nome deve ser uma string' })
  @MaxLength(100, { message: 'O nome não pode ter mais de 100 caracteres' })
  name?: string;

  @ApiProperty({
    description: 'Senha forte (mínimo 6 caracteres – recomenda-se 8+ com números e símbolos)',
    example: 'MinhaSenh@2025',
    minLength: 6,
    maxLength: 72, // bcrypt max
    writeOnly: true, // nunca aparece em respostas
  })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres' })
  @IsString()
  password: string;
}