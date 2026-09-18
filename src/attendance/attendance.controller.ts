import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateSessionAttendanceDto } from './dto/create-attendance.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
// import { AuthGuard } from '@nestjs/passport';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @UseGuards(AuthGuard)
  async saveAttendance(
    @Body() createAttendanceDto: CreateSessionAttendanceDto,
    @CurrentUser() user: any,
  ) {
    return this.attendanceService.saveDailyAttendance(
      createAttendanceDto,
      user,
    );
  }

  @Get('circle/:circleId')
  @UseGuards(AuthGuard)
  async getSessionByDate(
    @Param('circleId') circleId: string,
    @Query('date') date: string,
    @CurrentUser() user: any,
  ) {
    return this.attendanceService.getSessionByDate(circleId, date, user);
  }

  @Get('circle/:circleId/sessions')
  @UseGuards(AuthGuard)
  async getCircleSessions(
    @Param('circleId') circleId: string,
    @CurrentUser() user: any,
  ) {
    return this.attendanceService.getCircleSessions(circleId, user);
  }

  @Get('circle/:circleId/report')
  @UseGuards(AuthGuard)
  async getAttendanceReport(
    @Param('circleId') circleId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: any,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('يجب تحديد تاريخ البداية والنهاية');
    }
    return this.attendanceService.getAttendanceReport(
      circleId,
      startDate,
      endDate,
      user,
    );
  }
}
