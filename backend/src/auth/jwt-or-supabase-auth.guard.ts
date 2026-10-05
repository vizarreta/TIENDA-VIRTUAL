import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtOrSupabaseAuthGuard extends AuthGuard(['jwt', 'supabase-jwt']) {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
