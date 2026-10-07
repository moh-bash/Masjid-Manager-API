import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Attendance } from '../attendance/entities/attendance.entity';
import { CircleSession } from '../attendance/entities/circle-session.entity';
import { Mosque } from '../mosque/entities/mosque.entity';
import { Circle } from '../circle/entities/circle.entity';
import { Student } from '../students/entities/student.entity';
import { User } from '../users/entities/users.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { StudentCircle } from '../students/entities/student-circle.entity';
import { Recitation } from '../recitation/entities/recitation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Mosque,
      Circle,
      Student,
      User,
      Attendance,
      StudentCircle,
      CircleSession,
      Recitation,
    ]),
    UsersModule,
    AuthModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
