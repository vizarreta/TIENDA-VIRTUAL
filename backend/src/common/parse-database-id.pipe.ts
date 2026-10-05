import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export const MAX_DATABASE_INT = 2_147_483_647;

@Injectable()
export class ParseDatabaseIdPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const id = Number(value);
    if (!/^\d+$/.test(value) || !Number.isInteger(id) || id < 1 || id > MAX_DATABASE_INT) {
      throw new BadRequestException('INVALID_ID');
    }
    return id;
  }
}
