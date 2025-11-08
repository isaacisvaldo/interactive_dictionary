import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'The email address of the user',
    example: 'isaac.bunga@outlook.com',
    format: 'email',
    minLength: 5,
    maxLength: 255,
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: 'The user password',
    example: 'MinhaSenh@2025',
    minLength: 8,
    maxLength: 72, // typical bcrypt max
    writeOnly: true, // hides it in responses (optional but recommended)
  })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;
}