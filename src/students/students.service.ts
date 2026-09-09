import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Student } from './entities/student.entity';
import { StudentCircle } from './entities/student-circle.entity';
import { Mosque } from '../mosque/entities/mosque.entity';
import { Circle } from '../circle/entities/circle.entity';
import { User } from '../users/entities/users.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { TransferStudentDto } from './dto/transfer-student.dto';
import { Role } from '../users/enums/roles.enum';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { StudentLinkService } from '../student-link/student-link.service';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(StudentCircle)
    private readonly studentCircleRepository: Repository<StudentCircle>,
    @InjectRepository(Mosque)
    private readonly mosqueRepository: Repository<Mosque>,
    @InjectRepository(Circle)
    private readonly circleRepository: Repository<Circle>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>, 
    private readonly studentLinkService: StudentLinkService,
  ) {}

  private mapStudentWithAge(student: Student) {
    return {
      ...student,
      age: student.age,
    };
  }

  async create(dto: CreateStudentDto, currentUser: any) {
    const mosque = await this.mosqueRepository.findOne({
      where: { id: dto.mosqueId },
      relations: { manager: true },
    });

    if (!mosque) {
      throw new NotFoundException('المسجد المطلوب غير موجود');
    }

    const circle = await this.circleRepository.findOne({
      where: { id: dto.circleId, mosque: { id: dto.mosqueId } },
      relations: { teacher: true },
    });

    if (!circle) {
      throw new NotFoundException('الحلقة غير موجودة أو لا تتبع لهذا المسجد');
    }

    const isSystemAdmin = currentUser.role?.includes(Role.SYSTEM_ADMIN);
    const isMosqueManager = mosque.manager?.id === currentUser.id;
    const isCircleTeacher = circle.teacher?.id === currentUser.id;

    if (!isSystemAdmin && !isMosqueManager && !isCircleTeacher) {
      throw new ForbiddenException('لا تملك صلاحية إضافة طالب في هذه الحلقة');
    }

    const isStudentExists = await this.studentRepository.findOne({
      where: {
        name: dto.name,
        motherName: dto.motherName,
      },
    });

    if (isStudentExists) {
      throw new BadRequestException('الطالب موجود بالفعل');
    }

    let parentUser: User | undefined;
    if (dto.parentId) {
      const foundParent = await this.userRepository.findOne({
        where: { id: dto.parentId },
      });
      if (!foundParent) {
        throw new NotFoundException('حساب ولي الأمر المطلوب غير موجود');
      }
      parentUser = foundParent;
    }

    const student = this.studentRepository.create({
      name: dto.name,
      dateOfBirth: new Date(dto.dateOfBirth),
      motherName: dto.motherName,
      orphanStatus: dto.orphanStatus,
      registrationDate: new Date(dto.registrationDate),
      mosque,
      parent: parentUser,
    });

    const savedStudent = await this.studentRepository.save(student);

    const studentCircle = this.studentCircleRepository.create({
      student: savedStudent,
      circle,
      joinDate: new Date(),
      leaveDate: null,
    });

    await this.studentCircleRepository.save(studentCircle);

   await this.studentLinkService.generateOrUpdateCode(
      { studentId: savedStudent.id },
      currentUser,
    );

    return this.mapStudentWithAge(savedStudent);
  }

  async findAllByMosque(
    mosqueId: string,
    paginationQuery: PaginationQueryDto,
    currentUser: any,
  ) {
    const { page = 1, limit = 10 } = paginationQuery;
    const skip = (page - 1) * limit;

    const isSystemAdmin = currentUser.role?.includes(Role.SYSTEM_ADMIN);

    const mosque = await this.mosqueRepository.findOne({
      where: { id: mosqueId },
      relations: { manager: true },
    });

    if (!mosque) {
      throw new NotFoundException('المسجد غير موجود');
    }

    const isMosqueManager = mosque.manager?.id === currentUser.id;

    if (isSystemAdmin || isMosqueManager) {
      const [data, total] = await this.studentRepository.findAndCount({
        where: { mosque: { id: mosqueId } },
        skip,
        take: limit,
        relations: {
          parent: true,
          circleHistory: { circle: true },
        },
        order: { createdAt: 'DESC' },
      });

      const formattedData = data.map((student) => {
        const activeCircleEnrollment = student.circleHistory?.find(
          (ch) => ch.leaveDate === null,
        );
        return {
          ...this.mapStudentWithAge(student),
          activeCircle: activeCircleEnrollment
            ? {
                id: activeCircleEnrollment.circle.id,
                name: activeCircleEnrollment.circle.name,
                joinDate: activeCircleEnrollment.joinDate,
              }
            : null,
        };
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: formattedData,
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

    const teacherCircles = await this.circleRepository.find({
      where: { mosque: { id: mosqueId }, teacher: { id: currentUser.id } },
    });

    if (teacherCircles.length === 0) {
      return {
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }

    const circleIds = teacherCircles.map((c) => c.id);

    const [activeEnrollments, total] = await this.studentCircleRepository
      .createQueryBuilder('sc')
      .innerJoinAndSelect('sc.student', 'student')
      .innerJoinAndSelect('sc.circle', 'circle')
      .leftJoinAndSelect('student.parent', 'parent')
      .where('sc.circle_id IN (:...circleIds)', { circleIds })
      .andWhere('sc.leave_date IS NULL')
      .skip(skip)
      .take(limit)
      .orderBy('student.createdAt', 'DESC')
      .getManyAndCount();

    const data = activeEnrollments.map((sc) => ({
      ...this.mapStudentWithAge(sc.student),
      activeCircle: {
        id: sc.circle.id,
        name: sc.circle.name,
        joinDate: sc.joinDate,
      },
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      data,
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

  async findAllByCircle(circleId: string, paginationQuery: PaginationQueryDto) {
    const { page = 1, limit = 10 } = paginationQuery;
    const skip = (page - 1) * limit;

    const circle = await this.circleRepository.findOne({
      where: { id: circleId },
      relations: { mosque: true, teacher: true },
    });

    if (!circle) {
      throw new NotFoundException('الحلقة المحددة غير موجودة');
    }

    const [activeEnrollments, total] = await this.studentCircleRepository
      .createQueryBuilder('sc')
      .innerJoinAndSelect('sc.student', 'student')
      .innerJoinAndSelect('sc.circle', 'circle')
      .where('circle.id = :circleId', { circleId })
      .andWhere('sc.leave_date IS NULL')
      .skip(skip)
      .take(limit)
      .orderBy('student.createdAt', 'DESC')
      .getManyAndCount();

    const data = activeEnrollments.map((sc) => ({
      ...this.mapStudentWithAge(sc.student),
      activeCircle: {
        id: sc.circle.id,
        name: sc.circle.name,
        joinDate: sc.joinDate,
      },
    }));

    return {
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

   async findMyChildren(parentId: string) {
    const students = await this.studentRepository.find({
      where: { parent: { id: parentId } },
      relations: {
        mosque: true,
        circleHistory: {
          circle: {
            teacher: true,
          },
        },
      },
      order: { createdAt: 'DESC' },
    });

    return students.map((student) => {
      const activeEnrollment = student.circleHistory?.find(
        (ch) => ch.leaveDate === null,
      );

      return {
        id: student.id,
        name: student.name,
        mosqueName: student.mosque?.name || 'غير محدد',
        circleName: activeEnrollment?.circle?.name || 'غير مسجل في حلقة ',
        teacherName: activeEnrollment?.circle?.teacher?.name || 'لا يوجد معلم',
      };
    });
  }

  async findOne(id: string) {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: {
        mosque: { manager: true },
        parent: true,
        circleHistory: { circle: { teacher: true } },
      },
    });

    if (!student) {
      throw new NotFoundException('الطالب غير موجود');
    }

    const linkCode = await this.studentLinkService.getCodeByStudentId(id);

    const activeEnrollment = student.circleHistory?.find(
      (ch) => ch.leaveDate === null,
    );

    const pastEnrollments = student.circleHistory
      ?.filter((ch) => ch.leaveDate !== null)
      .map((ch) => ({
        circleId: ch.circle.id,
        circleName: ch.circle.name,
        joinDate: ch.joinDate,
        leaveDate: ch.leaveDate,
      }));


    return {
      ...this.mapStudentWithAge(student),
      linkCode,
      activeCircle: activeEnrollment
        ? {
            circleId: activeEnrollment.circle.id,
            circleName: activeEnrollment.circle.name,
            joinDate: activeEnrollment.joinDate,
          }
        : null,
      pastCircles: pastEnrollments || [],
    };
  }

  async update(id: string, dto: UpdateStudentDto, currentUser: any) {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: {
        mosque: { manager: true },
        circleHistory: { circle: { teacher: true } },
      },
    });

    if (!student) {
      throw new NotFoundException('الطالب غير موجود');
    }

    const activeEnrollment = student.circleHistory?.find(
      (ch) => ch.leaveDate === null,
    );

    const isSystemAdmin = currentUser.role?.includes(Role.SYSTEM_ADMIN);
    const isMosqueManager = student.mosque?.manager?.id === currentUser.id;
    const isCurrentTeacher =
      activeEnrollment?.circle?.teacher?.id === currentUser.id;

    if (!isSystemAdmin && !isMosqueManager && !isCurrentTeacher) {
      throw new ForbiddenException('لا تملك صلاحية تعديل بيانات هذا الطالب');
    }

    if (dto.parentId) {
      const foundParent = await this.userRepository.findOne({
        where: { id: dto.parentId },
      });
      if (!foundParent) {
        throw new NotFoundException('حساب ولي الأمر غير موجود');
      }
      student.parent = foundParent;
    }

    if (dto.name) student.name = dto.name;
    if (dto.dateOfBirth) student.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.motherName) student.motherName = dto.motherName;
    if (dto.orphanStatus) student.orphanStatus = dto.orphanStatus;
    if (dto.registrationDate)
      student.registrationDate = new Date(dto.registrationDate);

    await this.studentRepository.save(student);
    return { message: 'تم تحديث بيانات الطالب بنجاح' };
  }

  async transfer(id: string, dto: TransferStudentDto, currentUser: any) {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: {
        mosque: { manager: true },
        circleHistory: { circle: true },
      },
    });

    if (!student) {
      throw new NotFoundException('الطالب غير موجود');
    }

    const isSystemAdmin = currentUser.role?.includes(Role.SYSTEM_ADMIN);
    const isMosqueManager = student.mosque?.manager?.id === currentUser.id;

    if (!isSystemAdmin && !isMosqueManager) {
      throw new ForbiddenException('نقل الطالب متاح لمدير المسجد فقط');
    }

    const targetCircle = await this.circleRepository.findOne({
      where: { id: dto.newCircleId, mosque: { id: student.mosque.id } },
    });

    if (!targetCircle) {
      throw new NotFoundException(
        'الحلقة الجديدة غير موجودة أو لا تتبع لهذا المسجد',
      );
    }

    const activeEnrollment = student.circleHistory?.find(
      (ch) => ch.leaveDate === null,
    );

    if (activeEnrollment) {
      if (activeEnrollment.circle.id === targetCircle.id) {
        throw new BadRequestException(
          'الطالب مضاف بالفعل في هذه الحلقة حالياً',
        );
      }
      activeEnrollment.leaveDate = new Date();
      await this.studentCircleRepository.save(activeEnrollment);
    }

    const newEnrollment = this.studentCircleRepository.create({
      student,
      circle: targetCircle,
      joinDate: new Date(),
      leaveDate: null,
    });

    await this.studentCircleRepository.save(newEnrollment);

    return { message: 'تم نقل الطالب إلى الحلقة الجديدة بنجاح' };
  }

  async remove(id: string, currentUser: any) {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: { mosque: { manager: true } },
    });

    if (!student) {
      throw new NotFoundException('الطالب غير موجود');
    }

    const isSystemAdmin = currentUser.role?.includes(Role.SYSTEM_ADMIN);
    const isMosqueManager = student.mosque?.manager?.id === currentUser.id;

    if (!isSystemAdmin && !isMosqueManager) {
      throw new ForbiddenException('حذف الطالب متاح لمدير المسجد فقط');
    }

    await this.studentRepository.delete(id);
    return { message: 'تم حذف الطالب بنجاح' };
  }
}
