import { IsString, IsOptional, IsNumber } from 'class-validator';

export class KioskUpsertDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;
}
