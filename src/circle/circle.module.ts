import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CirclesService } from './circle.service';
import { CirclesController } from './circle.controller';
import { Circle } from './entities/circle.entity';
import { Mosque } from '../mosque/entities/mosque.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Circle, Mosque]),
    UsersModule,
    AuthModule,
  ],
  controllers: [CirclesController],
  providers: [CirclesService],
  exports: [CirclesService],
})
export class CircleModule {}