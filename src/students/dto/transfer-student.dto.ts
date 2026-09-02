import { IsNotEmpty, IsUUID } from 'class-validator';

export class TransferStudentDto {
  @IsNotEmpty()
  @IsUUID()
  newCircleId!: string;
}