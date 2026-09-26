import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, BadRequestException } from '@nestjs/common';
import { PrayerService } from './prayer.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { Role } from '../users/enums/roles.enum';
import { UpsertPrayerDto } from './dto/upsert-prayer.dto';

@Controller('prayers')
export class PrayerController {
  constructor(private readonly prayerService: PrayerService) {}

  @Post('upsert')
  async upsertPrayer(@Body() dto: UpsertPrayerDto, @Req() req: any) {
    return await this.prayerService.upsertTodayPrayer(dto, req.user);
  }

  @Get('student/:studentId/today')
  async getTodayPrayers(@Param('studentId') studentId: string) {
    return await this.prayerService.getTodayPrayers(studentId);
  }

  @Get('student/:studentId/report')
  async getStudentPrayerReport(
    @Param('studentId') studentId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('يجب توفير تاريخ البداية وتاريخ النهاية (startDate, endDate)');
    }
    return await this.prayerService.getStudentPrayerReport(studentId, startDate, endDate);
  }
}