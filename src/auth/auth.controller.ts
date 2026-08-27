import { Body, Controller, Post } from '@nestjs/common';
import { CreateUserDto } from '../users/DTO/createUserDto';
import { AuthService } from './auth.service';
import { AuthLoginDto } from './DTO/authLoginDto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('register')
    register(@Body() user: CreateUserDto) {
        return this.authService.register(user);
    }

    @Post('login')
    login(@Body() user: AuthLoginDto) {
        return this.authService.login(user);
    }
}
