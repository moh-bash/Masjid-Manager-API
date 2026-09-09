import { PartialType } from '@nestjs/mapped-types';
import { CreateSessionAttendanceDto } from './create-attendance.dto';

export class UpdateAttendanceDto extends PartialType(CreateSessionAttendanceDto) {}
