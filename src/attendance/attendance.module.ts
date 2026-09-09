import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { CircleSession } from './entities/circle-session.entity';
import { Attendance } from './entities/attendance.entity';
import { Circle } from '../circle/entities/circle.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { StudentCircle } from '../students/entities/student-circle.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CircleSession, Attendance, Circle, StudentCircle]),
    AuthModule,
    UsersModule,
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
