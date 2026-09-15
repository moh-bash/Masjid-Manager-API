import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreatePostCategoryDto {
  @IsString({ message: 'اسم التصنيف يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'اسم التصنيف مطلوب' })
  @MaxLength(100, { message: 'اسم التصنيف يجب ألا يتجاوز 100 حرف' })
  name!: string;
}