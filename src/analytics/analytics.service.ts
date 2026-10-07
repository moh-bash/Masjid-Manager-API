import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Mosque } from '../mosque/entities/mosque.entity';
import { Circle } from '../circle/entities/circle.entity';
import { User } from '../users/entities/users.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { CircleSession } from '../attendance/entities/circle-session.entity';
import { Student } from '../students/entities/student.entity';
import { StudentCircle } from '../students/entities/student-circle.entity';
import { Recitation } from '../recitation/entities/recitation.entity';
import { AttendanceStatus } from '../attendance/enums/endance-status.enum';
import { Role } from '../users/enums/roles.enum';

const QURAN_TOTAL_PAGES = 604;
const QURAN_TOTAL_AYAHS = 6236;

interface HifzRawRow {
  day: string | number;
  startAyah: number | string;
  endAyah: number | string;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Mosque)
    private readonly mosqueRepo: Repository<Mosque>,
    @InjectRepository(Circle)
    private readonly circleRepo: Repository<Circle>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(StudentCircle)
    private readonly studentCircleRepo: Repository<StudentCircle>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
    @InjectRepository(CircleSession)
    private readonly circleSessionRepo: Repository<CircleSession>,
    @InjectRepository(Recitation)
    private readonly recitationRepo: Repository<Recitation>,
  ) {}

  // ==========================================
  // 1. System Admin Analytics
  // ==========================================
  async getSystemAnalytics(year?: number, month?: number) {
    const { targetYear, targetMonth, startDate, endDate } = this.resolvePeriod(
      year,
      month,
    );

    const [
      totalMosques,
      totalCircles,
      totalStudents,
      totalManagers,
      totalTeachers,
      hifzRows,
    ] = await Promise.all([
      this.mosqueRepo.count(),
      this.circleRepo.count(),
      this.studentRepo.count(),
      this.userRepo
        .createQueryBuilder('u')
        .where(':role = ANY(u.role)', { role: Role.MOSQUE_MANAGER })
        .getCount(),
      this.userRepo
        .createQueryBuilder('u')
        .where(':role = ANY(u.role)', { role: Role.CIRCLE_TEACHER })
        .getCount(),
      this.queryHifzRows(undefined, startDate, endDate),
    ]);

    return {
      period: {
        year: targetYear,
        month: targetMonth,
      },
      kpis: {
        totalMosques,
        totalCircles,
        totalStudents,
        totalManagers,
        totalTeachers,
      },
      charts: {
        hifzProgress: this.buildHifzProgress(hifzRows, targetYear, targetMonth),
      },
    };
  }

  // ==========================================
  // 2. Mosque Manager Analytics
  // ==========================================
  async getMosqueAnalytics(
    mosqueId: string,
    userId: string,
    userRoles: string[],
    year?: number,
    month?: number,
  ) {
    const { targetYear, targetMonth, startDate, endDate } = this.resolvePeriod(
      year,
      month,
    );

    const mosque = await this.mosqueRepo.findOne({
      where: { id: mosqueId },
      relations: { manager: true },
    });

    if (!mosque) {
      throw new NotFoundException('المسجد غير موجود');
    }

    const roles = userRoles ?? [];
    const isSystemAdmin = roles.includes(Role.SYSTEM_ADMIN);
    const isMosqueManager =
      roles.includes(Role.MOSQUE_MANAGER) && mosque.manager?.id === userId;

    if (!isSystemAdmin && !isMosqueManager) {
      throw new ForbiddenException('ليس لديك صلاحية لعرض إحصائيات هذا المسجد');
    }

    const totalCircles = await this.circleRepo.count({
      where: { mosque: { id: mosqueId } },
    });

    const totalStudents = await this.studentRepo.count({
      where: { mosque: { id: mosqueId } },
    });

    const teacherCountResult = await this.circleRepo
      .createQueryBuilder('circle')
      .select('COUNT(DISTINCT circle.teacher_id)', 'count')
      .where('circle.mosque_id = :mosqueId', { mosqueId })
      .andWhere('circle.teacher_id IS NOT NULL')
      .getRawOne<{ count: string }>();

    const totalTeachers = parseInt(teacherCountResult?.count || '0', 10);

    const [totalSessions, attendanceStats, hifzRows] = await Promise.all([
      this.circleSessionRepo
        .createQueryBuilder('session')
        .innerJoin('session.circle', 'circle')
        .where('circle.mosque_id = :mosqueId', { mosqueId })
        .andWhere('session.date >= :startDate', { startDate })
        .andWhere('session.date < :endDate', { endDate })
        .getCount(),

      this.attendanceRepo
        .createQueryBuilder('attendance')
        .innerJoin('attendance.session', 'session')
        .innerJoin('session.circle', 'circle')
        .where('circle.mosque_id = :mosqueId', { mosqueId })
        .andWhere('session.date >= :startDate', { startDate })
        .andWhere('session.date < :endDate', { endDate })
        .select('attendance.status', 'status')
        .addSelect('COUNT(attendance.id)', 'count')
        .groupBy('attendance.status')
        .getRawMany<{ status: string; count: string }>(),

      this.queryHifzRows(mosqueId, startDate, endDate),
    ]);

    const countsByStatus = new Map<string, number>();
    for (const item of attendanceStats) {
      const parsed = parseInt(item.count, 10);
      countsByStatus.set(item.status, Number.isFinite(parsed) ? parsed : 0);
    }

    const totalAttendanceRecords = Array.from(countsByStatus.values()).reduce(
      (sum, count) => sum + count,
      0,
    );

    const attendanceBreakdown = Object.values(AttendanceStatus).map(
      (status) => {
        const count = countsByStatus.get(status) ?? 0;
        const percentage =
          totalAttendanceRecords > 0
            ? Math.round((count / totalAttendanceRecords) * 1000) / 10
            : 0;

        return { status, count, percentage };
      },
    );

    const hifzProgress = this.buildHifzProgress(
      hifzRows,
      targetYear,
      targetMonth,
    );

    return {
      period: {
        year: targetYear,
        month: targetMonth,
      },
      kpis: {
        totalCircles,
        totalStudents,
        totalTeachers,
      },
      charts: {
        attendance: {
          totalSessions,
          breakdown: attendanceBreakdown,
        },
        hifzProgress,
      },
    };
  }

  // ==========================================
  // 3. Circle Teacher Analytics
  // ==========================================
  async getCircleAnalytics(
    circleId: string,
    userId: string,
    userRoles: string[],
  ) {
    const circle = await this.circleRepo.findOne({
      where: { id: circleId },
      relations: {
        teacher: true,
        mosque: {
          manager: true,
        },
      },
    });

    if (!circle) {
      throw new NotFoundException('الحلقة غير موجودة');
    }

    const isSystemAdmin = userRoles.includes(Role.SYSTEM_ADMIN);
    const isMosqueManager =
      userRoles.includes(Role.MOSQUE_MANAGER) &&
      circle.mosque?.manager?.id === userId;
    const isTeacherOfCircle = circle.teacher?.id === userId;

    if (!isSystemAdmin && !isMosqueManager && !isTeacherOfCircle) {
      throw new ForbiddenException('ليس لديك صلاحية لعرض إحصائيات هذه الحلقة');
    }

    const activeStudentsCount = await this.studentCircleRepo.count({
      where: {
        circle: { id: circleId },
        leaveDate: IsNull(),
      },
    });

    const attendanceStats = await this.attendanceRepo
      .createQueryBuilder('attendance')
      .innerJoin('attendance.session', 'session')
      .where('session.circle_id = :circleId', { circleId })
      .select('attendance.status', 'status')
      .addSelect('COUNT(attendance.id)', 'count')
      .groupBy('attendance.status')
      .getRawMany<{ status: string; count: string }>();

    return {
      kpis: {
        totalStudents: activeStudentsCount,
        capacity: circle.maxStudents || 0,
      },
      charts: {
        attendance: attendanceStats.map((item) => ({
          status: item.status,
          count: parseInt(item.count, 10),
        })),
      },
    };
  }

  private resolvePeriod(year?: number, month?: number) {
    const now = new Date();
    const targetYear =
      typeof year === 'number' && Number.isFinite(year)
        ? Math.trunc(year)
        : now.getFullYear();
    const targetMonth =
      typeof month === 'number' &&
      Number.isFinite(month) &&
      month >= 1 &&
      month <= 12
        ? Math.trunc(month)
        : now.getMonth() + 1;

    const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const nextYear = targetMonth === 12 ? targetYear + 1 : targetYear;
    const nextMonth = targetMonth === 12 ? 1 : targetMonth + 1;
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

    return { targetYear, targetMonth, startDate, endDate };
  }

  private async queryHifzRows(
    mosqueId: string | undefined,
    startDate: string,
    endDate: string,
  ) {
    const query = this.recitationRepo
      .createQueryBuilder('recitation')
      .innerJoin('recitation.session', 'session')
      .where('session.date >= :startDate', { startDate })
      .andWhere('session.date < :endDate', { endDate });

    if (mosqueId) {
      query
        .innerJoin('session.circle', 'circle')
        .andWhere('circle.mosque_id = :mosqueId', { mosqueId });
    }

    return query
      .select('EXTRACT(DAY FROM session.date)', 'day')
      .addSelect('recitation.startAyah', 'startAyah')
      .addSelect('recitation.endAyah', 'endAyah')
      .getRawMany<HifzRawRow>();
  }

  private buildHifzProgress(
    rows: HifzRawRow[],
    targetYear: number,
    targetMonth: number,
  ) {
    const hifzByDay = new Map<number, { recitations: number; ayahs: number }>();
    for (const row of rows) {
      const day = parseInt(String(row.day), 10);
      if (!Number.isFinite(day) || day < 1) {
        continue;
      }

      const startAyah = Number(row.startAyah);
      const endAyah = Number(row.endAyah);
      const coveredAyahs =
        Number.isFinite(startAyah) &&
        Number.isFinite(endAyah) &&
        endAyah >= startAyah
          ? endAyah - startAyah + 1
          : 0;

      const entry = hifzByDay.get(day) ?? { recitations: 0, ayahs: 0 };
      entry.recitations += 1;
      entry.ayahs += coveredAyahs;
      hifzByDay.set(day, entry);
    }

    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    const byDay: Array<{
      date: string;
      day: number;
      recitations: number;
      ayahs: number;
      pages: number;
    }> = [];
    let totalRecitations = 0;
    let totalAyahs = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const entry = hifzByDay.get(day);
      const recitations = entry?.recitations ?? 0;
      const ayahs = entry?.ayahs ?? 0;
      const pages =
        ayahs > 0
          ? Math.max(
              1,
              Math.round((ayahs * QURAN_TOTAL_PAGES) / QURAN_TOTAL_AYAHS),
            )
          : 0;

      totalRecitations += recitations;
      totalAyahs += ayahs;

      byDay.push({
        date: `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        day,
        recitations,
        ayahs,
        pages,
      });
    }

    const totalPages =
      totalAyahs > 0
        ? Math.max(
            1,
            Math.round((totalAyahs * QURAN_TOTAL_PAGES) / QURAN_TOTAL_AYAHS),
          )
        : 0;

    return {
      totalRecitations,
      totalAyahs,
      totalPages,
      byDay,
    };
  }
}
