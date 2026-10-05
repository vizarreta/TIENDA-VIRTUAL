import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && user.password && (await bcrypt.compare(password, user.password))) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async register(email: string, password: string, fullName: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const user = await this.usersService.create({
        email,
        password: hashedPassword,
        fullName,
        role: 'customer',
      });
      return this.login(user);
    } catch (error) {
      if (error.code === 'P2002') throw new ConflictException('EMAIL_IN_USE');
      throw error;
    }
  }

  async findBySupabaseId(supabaseId: string) {
    return this.usersService.findBySupabaseId(supabaseId);
  }

  async createFromSupabase(supabaseUser: any) {
    return this.usersService.createFromSupabase(supabaseUser);
  }

  async updateRole(userId: string, role: string) {
    return this.usersService.updateRole(userId, role);
  }
}
