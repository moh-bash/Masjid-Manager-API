import { IsDateString, IsEnum, IsNotEmpty, IsUUID } from "class-validator";
import { PrayerName, PrayerStatus } from "../enums/prayer.enum";

export class CreatePrayerDto {
  @IsUUID()
  @IsNotEmpty()
  studentId!: string;

  @IsDateString()
  @IsNotEmpty()
  date!: string;

  @IsEnum(PrayerName)
  @IsNotEmpty()
  prayer!: PrayerName;

  @IsEnum(PrayerStatus)
  @IsNotEmpty()
  status!: PrayerStatus;
}