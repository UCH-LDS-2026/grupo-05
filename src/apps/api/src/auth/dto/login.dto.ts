import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  code!: string;

  // Requerido solo la primera vez que se canjea un código (alta del player).
  @IsOptional()
  @IsString()
  @MaxLength(60)
  name?: string;
}
