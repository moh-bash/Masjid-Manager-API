import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CirclesService } from './circle.service';
import { CreateCircleDto } from './dto/create-circle.dto';
import { UpdateCircleDto } from './dto/update-circle.dto';
import { Role } from '../users/enums/roles.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('circles')
export class CirclesController {
  constructor(private readonly circlesService: CirclesService) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.SYSTEM_ADMIN, Role.MOSQUE_MANAGER)
  create(
    @Body() createCircleDto: CreateCircleDto,
    @CurrentUser() user: any,
  ) {
    return this.circlesService.create(createCircleDto, user);
  }

  
  @Get('me')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.CIRCLE_TEACHER)
  findMyCircle(@CurrentUser() user: any) {
    return this.circlesService.findMyCircle(user);
  }

  @Get('mosque/:mosqueId')
  @UseGuards(AuthGuard)
  findByMosque(
    @Param('mosqueId') mosqueId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.circlesService.findByMosque(mosqueId, paginationQuery);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string) {
    return this.circlesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.SYSTEM_ADMIN, Role.MOSQUE_MANAGER)
  update(
    @Param('id') id: string,
    @Body() updateCircleDto: UpdateCircleDto,
    @CurrentUser() user: any,
  ) {
    return this.circlesService.update(id, updateCircleDto, user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.SYSTEM_ADMIN, Role.MOSQUE_MANAGER)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.circlesService.remove(id, user);
  }
}