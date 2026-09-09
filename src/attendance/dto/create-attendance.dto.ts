import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '../enums/endance-status.enum';

export class StudentAttendanceDto {
  @IsUUID()
  @IsNotEmpty()
  studentId!: string;

  @IsEnum(AttendanceStatus)
  @IsNotEmpty()
  status!: AttendanceStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateSessionAttendanceDto {
  @IsUUID()
  @IsNotEmpty()
  circleId!: string;

  @IsDateString()
  @IsNotEmpty()
  date!: string; 

  @IsString()
  @IsOptional()
  notes?: string; 

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentAttendanceDto)
  attendances!: StudentAttendanceDto[];
}