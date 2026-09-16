import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Recitation } from './entities/recitation.entity';
import { Student } from '../students/entities/student.entity';
import { CircleSession } from '../attendance/entities/circle-session.entity';
import { User } from '../users/entities/users.entity';
import { CreateRecitationDto } from './dto/create-recitation.dto';
import { UpdateRecitationDto } from './dto/update-recitation.dto';
import { GetRecitationsQueryDto } from './dto/get-recitations-query.dto';
import { Role } from '../users/enums/roles.enum';

@Injectable()
export class RecitationService {
  constructor(
    @InjectRepository(Recitation)
    private readonly recitationRepository: Repository<Recitation>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(CircleSession)
    private readonly sessionRepository: Repository<CircleSession>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(
    dto: CreateRecitationDto,
    currentUser: { id: string; role?: Role[] },
  ) {
    await this.assertCircleAccess(dto.sessionId, currentUser);

    const student = await this.studentRepository.findOne({
      where: { id: dto.studentId },
    });

    if (!student) {
      throw new NotFoundException('الطالب المحدد غير موجود');
    }

    let teacher: User | null = null;
    if (dto.teacherId) {
      teacher = await this.userRepository.findOne({
        where: { id: dto.teacherId },
      });

      if (!teacher) {
        throw new NotFoundException('المعلم المحدد غير موجود');
      }
    }

    this.validateAyahRange(dto.startAyah, dto.endAyah);

    const recitation = this.recitationRepository.create({
      suraNumber: dto.suraNumber,
      startAyah: dto.startAyah,
      endAyah: dto.endAyah,
      score: dto.score,
      notes: dto.notes,
      student: { id: dto.studentId },
      session: { id: dto.sessionId },
      teacher: teacher ? { id: teacher.id } : undefined,
    });

    await this.recitationRepository.save(recitation);

    return { message: 'تم حفظ التلاوة بنجاح' };
  }

  async findAll(query: GetRecitationsQueryDto) {
    const { page = 1, limit = 10 } = query;

    const where: FindOptionsWhere<Recitation> = {
      ...(query.studentId && { student: { id: query.studentId } }),
      ...(query.sessionId && { session: { id: query.sessionId } }),
      ...(query.teacherId && { teacher: { id: query.teacherId } }),
      ...(query.suraNumber !== undefined && { suraNumber: query.suraNumber }),
    };

    const [recitations, total] = await this.recitationRepository.findAndCount({
      where,
      relations: {
        student: true,
        session: { circle: true },
        teacher: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: recitations,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const recitation = await this.recitationRepository.findOne({
      where: { id },
      relations: {
        student: true,
        session: { circle: true },
        teacher: true,
      },
    });

    if (!recitation) {
      throw new NotFoundException('التلاوة المحددة غير موجودة');
    }

    return recitation;
  }

  async update(
    id: string,
    dto: UpdateRecitationDto,
    currentUser: { id: string; role?: Role[] },
  ) {
    const recitation = await this.recitationRepository.findOne({
      where: { id },
      relations: { session: { circle: true } },
    });

    if (!recitation) {
      throw new NotFoundException('التلاوة المحددة غير موجودة');
    }

    if (dto.sessionId && dto.sessionId !== recitation.session.id) {
      await this.assertCircleAccess(dto.sessionId, currentUser);
    }

    if (dto.studentId) {
      const student = await this.studentRepository.findOne({
        where: { id: dto.studentId },
      });

      if (!student) {
        throw new NotFoundException('الطالب المحدد غير موجود');
      }

      recitation.student = { id: dto.studentId } as Student;
    }

    if (dto.teacherId) {
      const teacher = await this.userRepository.findOne({
        where: { id: dto.teacherId },
      });

      if (!teacher) {
        throw new NotFoundException('المعلم المحدد غير موجود');
      }

      recitation.teacher = { id: dto.teacherId } as User;
    }

    if (dto.sessionId) {
      recitation.session = { id: dto.sessionId } as CircleSession;
    }

    if (dto.suraNumber !== undefined) recitation.suraNumber = dto.suraNumber;
    if (dto.startAyah !== undefined) recitation.startAyah = dto.startAyah;
    if (dto.endAyah !== undefined) recitation.endAyah = dto.endAyah;
    if (dto.score !== undefined) recitation.score = dto.score;
    if (dto.notes !== undefined) recitation.notes = dto.notes;

    this.validateAyahRange(recitation.startAyah, recitation.endAyah);

    await this.recitationRepository.save(recitation);

    return { message: 'تم تحديث التلاوة بنجاح' };
  }

  async remove(id: string) {
    const recitation = await this.recitationRepository.findOne({
      where: { id },
    });

    if (!recitation) {
      throw new NotFoundException('التلاوة المحددة غير موجودة');
    }

    await this.recitationRepository.remove(recitation);

    return { message: 'تم حذف التلاوة بنجاح' };
  }

  private validateAyahRange(startAyah: number, endAyah: number) {
    if (endAyah < startAyah) {
      throw new BadRequestException(
        'آية النهاية يجب أن تكون أكبر من أو تساوي آية البداية',
      );
    }
  }

  private async assertCircleAccess(
    sessionId: string,
    currentUser: { id: string; role?: Role[] },
  ) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: { circle: { teacher: true, mosque: { manager: true } } },
    });

    if (!session) {
      throw new NotFoundException('الجلسة المحددة غير موجودة');
    }

    const roles: Role[] = Array.isArray(currentUser.role)
      ? currentUser.role
      : [];

    const isCircleTeacher = session.circle?.teacher?.id === currentUser.id;
    const isManager =
      session.circle?.mosque?.manager?.id === currentUser.id ||
      roles.includes(Role.SYSTEM_ADMIN) ||
      roles.includes(Role.MOSQUE_MANAGER);

    if (!isCircleTeacher && !isManager) {
      throw new ForbiddenException('لا تملك صلاحية إدارة تلاوات هذه الحلقة');
    }

    return session;
  }
}
