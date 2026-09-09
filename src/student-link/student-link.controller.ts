import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { StudentLinkService } from './student-link.service';
import { GenerateCodeDto } from './dto/generate-code.dto';
import { ConnectStudentDto } from './dto/connect-student.dto';
import { Role } from '../users/enums/roles.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('student-link')
@UseGuards(AuthGuard, RolesGuard)
export class StudentLinkController {
  constructor(private readonly studentLinkService: StudentLinkService) {}

  @Post('generate')
  @Roles(Role.SYSTEM_ADMIN, Role.MOSQUE_MANAGER, Role.CIRCLE_TEACHER)
  generateCode(
    @Body() dto: GenerateCodeDto,
    @CurrentUser() user: any,
  ) {
    return this.studentLinkService.generateOrUpdateCode(dto, user);
  }

  @Post('connect')
  @Roles(Role.PARENT)
  connectStudent(
    @Body() dto: ConnectStudentDto,
    @CurrentUser() user: any,
  ) {
    return this.studentLinkService.connectStudent(dto, user);
  }
}