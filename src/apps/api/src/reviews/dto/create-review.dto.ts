import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateReviewDto {
  @IsInt() @Min(1) @Max(5)
  attention!: number;

  @IsInt() @Min(1) @Max(5)
  variety!: number;

  @IsInt() @Min(1) @Max(5)
  cleanliness!: number;

  @IsInt() @Min(1) @Max(5)
  prices!: number;

  @IsInt() @Min(1) @Max(5)
  ambiance!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
