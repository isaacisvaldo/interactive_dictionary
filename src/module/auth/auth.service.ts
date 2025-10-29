import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(email: string, password: string, name?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email }});
    if (existing) throw new ConflictException('Email already in use');
    const hashed = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { email, password: hashed, name }
    });
    const token = this.signToken(user.id, user.email);
    return { user: { id: user.id, email: user.email, name: user.name }, token };
  }

  async validateUser(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({ where: { email }});
    if (!user) return null;
    const ok = await bcrypt.compare(pass, user.password);
    if (!ok) return null;
    return user;
  }

  signToken(userId: number, email: string) {
    const payload = { sub: userId, email };
    return this.jwt.sign(payload);
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return { user: { id: user.id, email: user.email, name: user.name }, token: this.signToken(user.id, user.email) };
  }
}
