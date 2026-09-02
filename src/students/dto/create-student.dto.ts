import {
  IsEnum,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { OrphanStatus } from '../enums/orphan-status.enum';

export class CreateStudentDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsDateString()
  dateOfBirth!: string;

  @IsNotEmpty()
  @IsString()
  motherName!: string;

  @IsNotEmpty()
  @IsEnum(OrphanStatus)
  orphanStatus!: OrphanStatus;

  @IsNotEmpty()
  @IsDateString()
  registrationDate!: string;

  @IsNotEmpty()
  @IsUUID()
  mosqueId!: string;

  @IsNotEmpty()
  @IsUUID()
  circleId!: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}