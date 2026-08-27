import { PartialType } from '@nestjs/mapped-types';
import { CreateMosqueDto } from './create-mosque.dto';

export class UpdateMosqueDto extends PartialType(CreateMosqueDto) {}
