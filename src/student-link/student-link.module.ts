import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentLinkService } from './student-link.service';
import { StudentLinkController } from './student-link.controller';
import { StudentLinkCode } from './entities/student-link-code.entity';
import { Student } from '../students/entities/student.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudentLinkCode, Student]),
    AuthModule,
    UsersModule,
  ],
  controllers: [StudentLinkController],
  providers: [StudentLinkService],
  exports: [StudentLinkService],
})
export class StudentLinkModule {}