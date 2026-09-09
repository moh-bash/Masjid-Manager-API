import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { Student } from './entities/student.entity';
import { StudentCircle } from './entities/student-circle.entity';
import { Mosque } from '../mosque/entities/mosque.entity';
import { Circle } from '../circle/entities/circle.entity';
import { User } from '../users/entities/users.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { StudentLinkModule } from '../student-link/student-link.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, StudentCircle, Mosque, Circle, User]),
    AuthModule,
    UsersModule,
    StudentLinkModule
  ],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}