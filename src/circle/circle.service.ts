import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Circle } from './entities/circle.entity';
import { CreateCircleDto } from './dto/create-circle.dto';
import { UpdateCircleDto } from './dto/update-circle.dto';
import { UsersService } from '../users/users.service';
import { Mosque } from '../mosque/entities/mosque.entity';
import { Role } from '../users/enums/roles.enum';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { StudentCircle } from '../students/entities/student-circle.entity';

@Injectable()
export class CirclesService {
  constructor(
    @InjectRepository(Circle)
    private readonly circleRepository: Repository<Circle>,
    @InjectRepository(Mosque)
    private readonly mosqueRepository: Repository<Mosque>,
    private readonly usersService: UsersService,
    @InjectRepository(StudentCircle)
    private readonly studentCircleRepository: Repository<StudentCircle>,
  ) {}

  async create(createCircleDto: CreateCircleDto, currentUser: any) {
    const mosque = await this.mosqueRepository.findOne({
      where: { id: createCircleDto.mosqueId },
      relations: { manager: true },
    });

    if (!mosque) {
      throw new NotFoundException('المسجد المطلوب غير موجود');
    }

    const isSystemAdmin = currentUser.role?.includes(Role.SYSTEM_ADMIN);
    const isMosqueManager = mosque.manager?.id === currentUser.id;

    if (!isSystemAdmin && !isMosqueManager) {
      throw new ForbiddenException('لا تملك صلاحية إضافة حلقة لهذا المسجد');
    }

    const teacher = await this.usersService.findUserByEmail(
      createCircleDto.teacherEmail,
    );

    if (!teacher) {
      throw new NotFoundException('المعلم بهذا البريد الإلكتروني غير موجود');
    }

    if (!teacher.role.includes(Role.CIRCLE_TEACHER)) {
      await this.usersService.addRoleToUser(teacher, Role.CIRCLE_TEACHER);
    }

    const circle = this.circleRepository.create({
      name: createCircleDto.name,
      description: createCircleDto.description,
      level: createCircleDto.level,
      maxStudents: createCircleDto.maxStudents,
      mosque,
      teacher,
    });

    return await this.circleRepository.save(circle);
  }

  async findMyCircle(currentUser: any) {
    const circle = await this.circleRepository.find({
      where: { teacher: { id: currentUser.id } },
      relations: { mosque: true },
      select: {
        id: true,
        name: true,
        teacher: {
          id: true,
        },
      },
    });

    return circle;
  }

  async findAll(paginationQuery: PaginationQueryDto) {
    const { page = 1, limit = 10 } = paginationQuery;
    const skip = (page - 1) * limit;

    const [data, total] = await this.circleRepository.findAndCount({
      skip,
      take: limit,
      relations: {
        teacher: true,
        mosque: true,
      },
      select: {
        id: true,
        name: true,
        level: true,
        createdAt: true,
        teacher: {
          id: true,
          name: true,
        },
        mosque: {
          id: true,
          name: true,
        },
      },
      order: { createdAt: 'DESC' },
    });

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

  async findByMosque(mosqueId: string, paginationQuery: PaginationQueryDto) {
    const { page = 1, limit = 10 } = paginationQuery;
    const skip = (page - 1) * limit;

    const [data, total] = await this.circleRepository.findAndCount({
      where: { mosque: { id: mosqueId } },
      skip,
      take: limit,
      relations: {
        teacher: true,
        mosque: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        level: true,
        maxStudents: true,
        createdAt: true,
        teacher: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
        },
        mosque: {
          id: true,
          name: true,
        },
      },
      order: { createdAt: 'DESC' },
    });

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

  async findOne(id: string) {
    const circle = await this.circleRepository.findOne({
      where: { id },
      relations: { teacher: true, mosque: true },
    });

    if (!circle) {
      throw new NotFoundException(`الحلقة غير موجودة`);
    }

    const activeStudentsCount = await this.studentCircleRepository.count({
      where: { circle: { id }, leaveDate: IsNull() },
    });

    const historicalStudentsCount = await this.studentCircleRepository.count({
      where: { circle: { id }, leaveDate: Not(IsNull()) },
    });

    return {
      ...circle,
      activeStudentsCount,
      historicalStudentsCount,
    };
  }

  async update(id: string, updateCircleDto: UpdateCircleDto, currentUser: any) {
    const circle = await this.circleRepository.findOne({
      where: { id },
      relations: { mosque: { manager: true }, teacher: true },
    });

    if (!circle) {
      throw new NotFoundException('الحلقة غير موجودة');
    }

    const isSystemAdmin = currentUser.role?.includes(Role.SYSTEM_ADMIN);
    const isMosqueManager = circle.mosque?.manager?.id === currentUser.id;

    if (!isSystemAdmin && !isMosqueManager) {
      throw new ForbiddenException('لا تملك صلاحية تعديل هذه الحلقة');
    }

    if (updateCircleDto.teacherEmail) {
      const teacher = await this.usersService.findUserByEmail(
        updateCircleDto.teacherEmail,
      );
      if (!teacher) {
        throw new NotFoundException('المعلم بهذا البريد الإلكتروني غير موجود');
      }
      if (!teacher.role.includes(Role.CIRCLE_TEACHER)) {
        await this.usersService.addRoleToUser(teacher, Role.CIRCLE_TEACHER);
      }
      circle.teacher = teacher;
    }

    if (updateCircleDto.name) circle.name = updateCircleDto.name;
    if (updateCircleDto.description !== undefined)
      circle.description = updateCircleDto.description;
    if (updateCircleDto.level) circle.level = updateCircleDto.level;
    if (updateCircleDto.maxStudents)
      circle.maxStudents = updateCircleDto.maxStudents;

    await this.circleRepository.save(circle);
    return { message: 'تم تحديث الحلقة بنجاح' };
  }

  async remove(id: string, currentUser: any) {
    const circle = await this.circleRepository.findOne({
      where: { id },
      relations: { mosque: { manager: true } },
    });

    if (!circle) {
      throw new NotFoundException('الحلقة غير موجودة');
    }

    const isSystemAdmin = currentUser.role?.includes(Role.SYSTEM_ADMIN);
    const isMosqueManager = circle.mosque?.manager?.id === currentUser.id;

    if (!isSystemAdmin && !isMosqueManager) {
      throw new ForbiddenException('لا تملك صلاحية حذف هذه الحلقة');
    }

    await this.circleRepository.delete(id);
    return { message: 'تم حذف الحلقة بنجاح' };
  }
}
