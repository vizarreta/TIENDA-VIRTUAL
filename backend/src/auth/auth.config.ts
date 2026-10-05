import { ConfigService } from '@nestjs/config';

export function jwtSecret(config: ConfigService): string {
  const secret = config.get<string>('JWT_SECRET');
  if (!secret || secret.length < 32 || /super-secret-key|change-me|your-secret/i.test(secret)) {
    throw new Error('JWT_SECRET must be configured with a random secret of at least 32 characters');
  }
  return secret;
}

export function trustedRole(appMetadata: { role?: unknown } | undefined): 'admin' | 'customer' {
  return appMetadata?.role === 'admin' ? 'admin' : 'customer';
}
