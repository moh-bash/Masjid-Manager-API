import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
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
}