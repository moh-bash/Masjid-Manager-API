import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MosqueModule } from './mosque/mosque.module';
import { CircleModule } from './circle/circle.module';
import { StudentsModule } from './students/students.module';
import { StudentLinkModule } from './student-link/student-link.module';
import { AttendanceModule } from './attendance/attendance.module';
import { PostsModule } from './posts/posts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    UsersModule,
    AuthModule,
    MosqueModule,
    CircleModule,
    StudentsModule,
    StudentLinkModule,
    AttendanceModule,
    PostsModule,
    
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
