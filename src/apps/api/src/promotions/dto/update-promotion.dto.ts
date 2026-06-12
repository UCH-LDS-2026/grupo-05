import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  ValidateNested,
  IsISO8601,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RewardType, PromotionRuleType } from '@prisma/client';

export class UpdatePromotionRuleInputDto {
  @IsEnum(PromotionRuleType)
  type!: PromotionRuleType;

  @IsOptional()
  @IsInt()
  @Min(1)
  minVisits?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  windowDays?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  products?: string[];
}

export class UpdatePromotionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsEnum(RewardType)
  rewardType?: RewardType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rewardValue?: number | null;

  @IsOptional()
  @IsString()
  rewardProduct?: string | null;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  audienceDays?: number[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  audienceFromHour?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  audienceToHour?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  capPerPlayer?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  capPerPeriod?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  capTotal?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  periodDays?: number | null;

  @IsOptional()
  @IsISO8601()
  startsAt?: string | null;

  @IsOptional()
  @IsISO8601()
  endsAt?: string | null;

  /** Si se envía, reemplaza TODAS las reglas de la promoción. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePromotionRuleInputDto)
  rules?: UpdatePromotionRuleInputDto[];
}
