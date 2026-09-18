import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateRecitationDto {
  @IsUUID()
  @IsNotEmpty()
  studentId!: string;

  @IsUUID()
  @IsOptional()
  teacherId?: string;

  @IsInt()
  @Min(1)
  @Max(114)
  @IsNotEmpty()
  suraNumber!: number;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  startAyah!: number;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  endAyah!: number;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsNotEmpty()
  score!: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
