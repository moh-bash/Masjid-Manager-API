import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecitationService } from './recitation.service';
import { RecitationController } from './recitation.controller';
import { Recitation } from './entities/recitation.entity';
import { Student } from '../students/entities/student.entity';
import { StudentCircle } from '../students/entities/student-circle.entity';
import { CircleSession } from '../attendance/entities/circle-session.entity';
import { User } from '../users/entities/users.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Recitation,
      Student,
      StudentCircle,
      CircleSession,
      User,
    ]),
    AuthModule,
    UsersModule,
  ],
  controllers: [RecitationController],
  providers: [RecitationService],
  exports: [RecitationService],
})
export class RecitationModule {}
