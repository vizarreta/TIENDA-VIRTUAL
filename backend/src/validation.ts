import { ValidationPipe } from '@nestjs/common';
import * as transformerPackage from 'class-transformer';
import * as validatorPackage from 'class-validator';

export function createValidationPipe() {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    validatorPackage,
    transformerPackage,
  });
}
