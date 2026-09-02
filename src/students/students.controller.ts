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
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { TransferStudentDto } from './dto/transfer-student.dto';
import { Role } from '../users/enums/roles.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.SYSTEM_ADMIN, Role.MOSQUE_MANAGER, Role.CIRCLE_TEACHER)
  create(
    @Body() createStudentDto: CreateStudentDto,
    @CurrentUser() user: any,
  ) {
    return this.studentsService.create(createStudentDto, user);
  }

  @Get('mosque/:mosqueId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.SYSTEM_ADMIN, Role.MOSQUE_MANAGER, Role.CIRCLE_TEACHER)
  findAllByMosque(
    @Param('mosqueId') mosqueId: string,
    @Query() paginationQuery: PaginationQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.studentsService.findAllByMosque(
      mosqueId,
      paginationQuery,
      user,
    );
  }

  @Get('circle/:circleId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.SYSTEM_ADMIN, Role.MOSQUE_MANAGER, Role.CIRCLE_TEACHER)
  findAllByCircle(
    @Param('circleId') circleId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.studentsService.findAllByCircle(
      circleId,
      paginationQuery,
    );
  }

  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.SYSTEM_ADMIN, Role.MOSQUE_MANAGER, Role.CIRCLE_TEACHER)
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.SYSTEM_ADMIN, Role.MOSQUE_MANAGER, Role.CIRCLE_TEACHER)
  update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
    @CurrentUser() user: any,
  ) {
    return this.studentsService.update(id, updateStudentDto, user);
  }

  @Patch(':id/transfer')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.SYSTEM_ADMIN, Role.MOSQUE_MANAGER)
  transfer(
    @Param('id') id: string,
    @Body() transferStudentDto: TransferStudentDto,
    @CurrentUser() user: any,
  ) {
    return this.studentsService.transfer(id, transferStudentDto, user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.SYSTEM_ADMIN, Role.MOSQUE_MANAGER)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.studentsService.remove(id, user);
  }
}