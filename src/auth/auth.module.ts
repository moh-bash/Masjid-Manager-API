import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/role.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService , AuthGuard, RolesGuard],
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          global: true,
          secret: config.get<string>('JWT_SECRET'),
          signOptions: { expiresIn: config.get<number>('JWT_EXPIRS_IN') }
        }
      }
    }),
    forwardRef(() => UsersModule)
  ],
  exports: [AuthService, AuthGuard, RolesGuard, JwtModule]
})
export class AuthModule {}
