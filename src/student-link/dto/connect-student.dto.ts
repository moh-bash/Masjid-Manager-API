import { IsString, IsNotEmpty, Length } from 'class-validator';

export class ConnectStudentDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'الكود يجب أن يتكون من 6 خانات' })
  code!: string;
}