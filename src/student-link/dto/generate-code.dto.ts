import { IsOptional, IsInt, Min, IsDateString, IsUUID } from 'class-validator';

export class GenerateCodeDto {
  @IsUUID()
  studentId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsages?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}