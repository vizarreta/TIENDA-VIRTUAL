import { BadRequestException } from '@nestjs/common';
import { isUUID } from 'class-validator';

export function getSessionId(headers: Record<string, string>): string {
  const id = headers['x-session-id'];
  if (!id || !isUUID(id)) throw new BadRequestException('INVALID_SESSION');
  return id;
}
