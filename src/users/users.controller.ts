import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from './enums/roles.enum';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
    ) {}

    @Get()
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SYSTEM_ADMIN)
    getAllUsers(@Query() paginationQuery: PaginationQueryDto){
        return this.usersService.getAllUsers(paginationQuery);
    }

    @Get('me')
    @UseGuards(AuthGuard)
    getCurrentUser(@CurrentUser() user: any) {
        return user;
    }
}
