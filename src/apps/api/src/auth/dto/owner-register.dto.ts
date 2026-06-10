import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

/** Alta de un Owner. Queda en estado PENDIENTE_VALIDACION hasta que un Admin lo valide. */
export class OwnerRegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name!: string;

  @IsEmail()
  @MaxLength(120)
  email!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(72) // límite de bcrypt
  password!: string;
}
