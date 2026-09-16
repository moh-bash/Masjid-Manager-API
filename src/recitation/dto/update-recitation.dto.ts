import { PartialType } from '@nestjs/mapped-types';
import { CreateRecitationDto } from './create-recitation.dto';

export class UpdateRecitationDto extends PartialType(CreateRecitationDto) {}
