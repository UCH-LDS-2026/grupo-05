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

export class PromotionRuleInputDto {
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

export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty()
  kioskId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsEnum(RewardType)
  rewardType!: RewardType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rewardValue?: number;

  @IsOptional()
  @IsString()
  rewardProduct?: string;

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
  audienceFromHour?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  audienceToHour?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  capPerPlayer?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  capPerPeriod?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  capTotal?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  periodDays?: number;

  @IsOptional()
  @IsISO8601()
  startsAt?: string;

  @IsOptional()
  @IsISO8601()
  endsAt?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromotionRuleInputDto)
  rules!: PromotionRuleInputDto[];
}
