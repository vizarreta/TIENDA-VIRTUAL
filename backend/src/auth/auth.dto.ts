import { IsEmail, IsString, Length, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @IsEmail()
  @MaxLength(254)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email: string;

  @IsString()
  @Length(1, 72)
  password: string;
}

export class RegisterDto extends LoginDto {
  @IsString()
  @Length(8, 72)
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+{}|;':",.<>?/]).{8,72}$/)
  password: string;

  @IsString()
  @Length(2, 120)
  @Matches(/^(?=.*\p{L})[\p{L}\p{M} '\u2019-]{2,120}$/u)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().normalize('NFC') : value))
  fullName: string;
}
