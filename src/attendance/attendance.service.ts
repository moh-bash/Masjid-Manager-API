import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CircleSession } from './entities/circle-session.entity';
import { Attendance } from './entities/attendance.entity';
import { Circle } from '../circle/entities/circle.entity';
import { CreateSessionAttendanceDto } from './dto/create-attendance.dto';
import { StudentCircle } from '../students/entities/student-circle.entity';
import {  Between } from 'typeorm';
import { Role } from '../users/enums/roles.enum';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(CircleSession)
    private readonly sessionRepository: Repository<CircleSession>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(Circle)
    private readonly circleRepository: Repository<Circle>,
    @InjectRepository(StudentCircle)
    private readonly studentCircleRepository: Repository<StudentCircle>,
  ) {}

  async saveDailyAttendance(dto: CreateSessionAttendanceDto, currentUser: any) {
    const circle = await this.circleRepository.findOne({
      where: { id: dto.circleId },
      relations: { teacher: true, mosque: { manager: true } },
    });

    if (!circle) {
      throw new NotFoundException('الحلقة المحددة غير موجودة');
    }

    const sessionDate = new Date(dto.date);

    let session = await this.sessionRepository.findOne({
      where: {
        circle: { id: circle.id },
        date: sessionDate,
      },
      relations: {
        attendances: { student: true },
      },
    });

    if (!session) {
      session = this.sessionRepository.create({
        date: sessionDate,
        circle,
        notes: dto.notes,
        createdBy: { id: currentUser.id } as any,
        attendances: [],
      });
    } else {
      if (dto.notes !== undefined) session.notes = dto.notes;
      session.createdBy = { id: currentUser.id } as any;
    }

    const attendanceRecords = dto.attendances.map((studentRecord) => {
      const existingRecord = session?.attendances?.find(
        (a) => a.student.id === studentRecord.studentId,
      );

      if (existingRecord) {
        existingRecord.status = studentRecord.status;
        existingRecord.notes = studentRecord.notes;
        return existingRecord;
      }

      return this.attendanceRepository.create({
        student: { id: studentRecord.studentId } as any,
        status: studentRecord.status,
        notes: studentRecord.notes,
      });
    });

    session.attendances = attendanceRecords;

    await this.sessionRepository.save(session);

    return { message: 'تم حفظ سجل الحضور بنجاح' };
  }

  async getSessionByDate(circleId: string, date: string, currentUser: any) {
    const session = await this.sessionRepository.findOne({
      where: {
        circle: { id: circleId },
        date: new Date(date),
      },
      relations: {
        attendances: { student: true },
      },
    });

    if (!session) {
      return { message: 'لا يوجد تفقد مسجل في هذا التاريخ', data: null };
    }

    return {
      id: session.id,
      date: session.date,
      notes: session.notes,
      attendances: session.attendances.map((a) => ({
        studentId: a.student.id,
        studentName: a.student.name,
        status: a.status,
        notes: a.notes,
      })),
    };
  }

  async getAttendanceReport(
    circleId: string,
    startDate: string,
    endDate: string,
    currentUser: any,
  ) {
    const circle = await this.circleRepository.findOne({
      where: { id: circleId },
      relations: { teacher: true, mosque: { manager: true } },
    });

    if (!circle) {
      throw new NotFoundException('الحلقة المحددة غير موجودة');
    }

    const isCircleTeacher = circle.teacher?.id === currentUser.id;

    if (!isCircleTeacher) {
      throw new ForbiddenException('لا تملك صلاحية عرض تقارير هذه الحلقة');
    }

    const sessions = await this.sessionRepository.find({
      where: {
        circle: { id: circleId },
        date: Between(new Date(startDate), new Date(endDate)),
      },
      relations: { attendances: { student: true } },
      order: { date: 'ASC' }, 
    });

    const activeEnrollments = await this.studentCircleRepository.find({
      where: { circle: { id: circleId }, leaveDate: IsNull() },
      relations: { student: true },
      order: { student: { name: 'ASC' } },
    });

    const studentsMap = new Map();
    activeEnrollments.forEach((enrollment) => {
      studentsMap.set(enrollment.student.id, {
        id: enrollment.student.id,
        name: enrollment.student.name,
        records: {}, 
      });
    });

    const dates: string[] = [];

    sessions.forEach((session) => {
      const dateStr =
        typeof session.date === 'string'
          ? session.date
          : session.date.toISOString().split('T')[0];

      if (!dates.includes(dateStr)) {
        dates.push(dateStr);
      }

      session.attendances.forEach((attendance) => {
        const studentId = attendance.student.id;
        if (studentsMap.has(studentId)) {
          const studentData = studentsMap.get(studentId);
          studentData.records[dateStr] = attendance.status;
        }
      });
    });

    return {
      circleName: circle.name,
      dates,
      students: Array.from(studentsMap.values()),
    };
  }
}
