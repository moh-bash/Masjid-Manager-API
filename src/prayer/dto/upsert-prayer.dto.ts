import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { PrayerName, PrayerStatus } from '../enums/prayer.enum';

export class UpsertPrayerDto {
  @IsUUID()
  @IsNotEmpty()
  studentId!: string;

  @IsEnum(PrayerName)
  @IsNotEmpty()
  prayer!: PrayerName;

  @IsEnum(PrayerStatus)
  @IsNotEmpty()
  status!: PrayerStatus;
}