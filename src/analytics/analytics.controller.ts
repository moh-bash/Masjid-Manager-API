import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AnalyticsPeriodQueryDto } from './dto/analytics-period-query.dto';

interface AuthenticatedUser {
  id: string;
  role: string[];
}

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('system-admin')
  async getSystemAnalytics(@Query() query: AnalyticsPeriodQueryDto) {
    return this.analyticsService.getSystemAnalytics(query.year, query.month);
  }

  @Get('mosques/:mosqueId')
  @UseGuards(AuthGuard)
  async getMosqueAnalytics(
    @Param('mosqueId') mosqueId: string,
    @Query() query: AnalyticsPeriodQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.analyticsService.getMosqueAnalytics(
      mosqueId,
      user.id,
      user.role,
      query.year,
      query.month,
    );
  }

  @Get('circles/:circleId')
  async getCircleAnalytics(
    @Param('circleId') circleId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.analyticsService.getCircleAnalytics(
      circleId,
      user.id,
      user.role,
    );
  }
}
