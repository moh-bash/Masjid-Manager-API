import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from './enums/roles.enum';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
    ) {}

    @Get()
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SYSTEM_ADMIN)
    getAllUsers(){
        return this.usersService.getAllUsers();
    }
}
