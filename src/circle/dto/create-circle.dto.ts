import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateCircleDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(5)
  level!: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  maxStudents!: number;

  @IsNotEmpty()
  @IsEmail()
  teacherEmail!: string;

  @IsNotEmpty()
  @IsUUID()
  mosqueId!: string;
}