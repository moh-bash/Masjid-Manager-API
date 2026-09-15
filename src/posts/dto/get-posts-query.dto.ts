import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class GetPostsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string; 

  @IsOptional()
  @IsUUID('4', { message: 'معرف التصنيف غير صالح' })
  categoryId?: string; 

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isPublished?: boolean;
}