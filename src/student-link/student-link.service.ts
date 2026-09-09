import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentLinkCode } from './entities/student-link-code.entity';
import { Student } from '../students/entities/student.entity';
import { GenerateCodeDto } from './dto/generate-code.dto';
import { ConnectStudentDto } from './dto/connect-student.dto';
import { Role } from '../users/enums/roles.enum';

@Injectable()
export class StudentLinkService {
  constructor(
    @InjectRepository(StudentLinkCode)
    private readonly linkCodeRepository: Repository<StudentLinkCode>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  private generateRandomCode(length: number = 6): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async generateOrUpdateCode(dto: GenerateCodeDto, currentUser: any) {
    const student = await this.studentRepository.findOne({
      where: { id: dto.studentId },
      relations: { mosque: { manager: true } },
    });

    if (!student) {
      throw new NotFoundException('الطالب غير موجود');
    }

    const existingCode = await this.linkCodeRepository.findOne({
      where: { student: { id: student.id } },
    });
    if (existingCode) {
      await this.linkCodeRepository.remove(existingCode);
    }

    let codeString = '';
    let isUnique = false;
    while (!isUnique) {
      codeString = this.generateRandomCode(6);
      const exists = await this.linkCodeRepository.findOne({
        where: { code: codeString },
      });
      if (!exists) isUnique = true;
    }

    const newCode = this.linkCodeRepository.create({
      code: codeString,
      student,
      maxUsages: dto.maxUsages || null,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      createdBy: { id: currentUser.id } as any,
    });

    await this.linkCodeRepository.save(newCode);

    return {
      message: 'تم توليد الكود بنجاح',
      code: newCode.code,
      expiresAt: newCode.expiresAt,
      maxUsages: newCode.maxUsages,
    };
  }

  async connectStudent(dto: ConnectStudentDto, currentUser: any) {
    const linkCode = await this.linkCodeRepository.findOne({
      where: { code: dto.code.toUpperCase() },
      relations: { student: { parent: true } },
    });

    if (!linkCode) {
      throw new BadRequestException('الكود غير صحيح أو منتهي الصلاحية');
    }

    if (linkCode.expiresAt && new Date() > linkCode.expiresAt) {
      await this.linkCodeRepository.remove(linkCode);
      throw new BadRequestException('لقد انتهت صلاحية هذا الكود');
    }

    if (linkCode.student.parent) {
      if (linkCode.student.parent.id === currentUser.id) {
        throw new BadRequestException('أنت مرتبط بالفعل بهذا الطالب');
      }
      throw new BadRequestException('هذا الطالب مرتبط بولي أمر بالفعل');
    }

    await this.studentRepository.update(linkCode.student.id, {
      parent: { id: currentUser.id } as any,
    });

    linkCode.currentUsages += 1;
    if (linkCode.maxUsages && linkCode.currentUsages >= linkCode.maxUsages) {
      await this.linkCodeRepository.remove(linkCode);
    } else {
      await this.linkCodeRepository.save(linkCode);
    }

    return {
      message: 'تم ربط الطالب بحسابك بنجاح',
      studentId: linkCode.student.id,
    };
  }

  async getCodeByStudentId(studentId: string): Promise<string | null> {
    const record = await this.linkCodeRepository.findOne({
      where: { student: { id: studentId } },
    });
    
    return record ? record.code : null;
  }
}