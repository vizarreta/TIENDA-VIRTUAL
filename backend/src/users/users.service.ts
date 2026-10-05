import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { trustedRole } from '../auth/auth.config';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findBySupabaseId(supabaseId: string) {
    return this.prisma.user.findUnique({ where: { supabaseId } });
  }

  async create(data: { email: string; password: string; fullName: string; role?: string }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        role: data.role || 'customer',
      },
    });
  }

  async createFromSupabase(supabaseUser: any) {
    const role = trustedRole(supabaseUser.appMetadata);
    try {
      return await this.prisma.user.upsert({
        where: { supabaseId: supabaseUser.id },
        update: { role },
        create: {
          email: supabaseUser.email,
          fullName: supabaseUser.userMetadata?.full_name || supabaseUser.email?.split('@')[0],
          avatarUrl: supabaseUser.userMetadata?.avatar_url || supabaseUser.userMetadata?.picture,
          role,
          supabaseId: supabaseUser.id,
        },
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('EMAIL_IN_USE');
      }
      throw error;
    }
  }

  async updateRole(id: string, role: string) {
    return this.prisma.user.update({
      where: { id },
      data: { role },
    });
  }

  async updateSupabaseData(id: string, data: { avatarUrl?: string; fullName?: string }) {
    return this.prisma.user.update({
      where: { id },
      data: {
        avatarUrl: data.avatarUrl,
        fullName: data.fullName,
      },
    });
  }
}
