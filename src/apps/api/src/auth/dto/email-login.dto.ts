import { IsEmail, IsString, MaxLength } from 'class-validator';

/** Login por email+password (owner o admin). */
export class EmailLoginDto {
  @IsEmail()
  @MaxLength(120)
  email!: string;

  @IsString()
  @MaxLength(72)
  password!: string;
}
