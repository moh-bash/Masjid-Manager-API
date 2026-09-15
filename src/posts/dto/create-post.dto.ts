import { 
  IsBoolean, 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  IsUUID, 
  MaxLength 
} from 'class-validator';

export class CreatePostDto {
  @IsString({ message: 'عنوان المقال يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'عنوان المقال مطلوب' })
  @MaxLength(255, { message: 'عنوان المقال يجب ألا يتجاوز 255 حرف' })
  title!: string;

  @IsString({ message: 'محتوى المقال يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'محتوى المقال مطلوب' })
  content!: string; 

  @IsString({ message: 'المقتطف يجب أن يكون نصاً' })
  @IsOptional()
  excerpt?: string;

  @IsString({ message: 'مسار/رابط الصورة غير صحيح' })
  @IsOptional()
  image?: string; 

  @IsOptional()
  isPublished?: boolean;

  @IsUUID('4', { message: 'معرف التصنيف غير صالح' })
  @IsOptional()
  categoryId?: string;
}