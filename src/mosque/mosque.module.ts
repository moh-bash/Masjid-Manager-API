import { Module } from '@nestjs/common';
import { MosqueService } from './mosque.service';
import { MosqueController } from './mosque.controller';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mosque } from './entities/mosque.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [MosqueController],
  providers: [MosqueService],
  imports: [
    TypeOrmModule.forFeature([Mosque]),
    UsersModule,
    AuthModule
  ],
})
export class MosqueModule {}
