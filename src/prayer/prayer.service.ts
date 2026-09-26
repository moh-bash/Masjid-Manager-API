import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Prayer } from './entities/prayer.entity';
import { User } from '../users/entities/users.entity';
import { UpsertPrayerDto } from './dto/upsert-prayer.dto';

@Injectable()
export class PrayerService {
  constructor(
    @InjectRepository(Prayer)
    private readonly prayerRepository: Repository<Prayer>,
  ) {}

  private getTodayString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async upsertTodayPrayer(dto: UpsertPrayerDto, currentUser: User): Promise<Prayer> {
    const todayStr = this.getTodayString();

    let existingLog = await this.prayerRepository.findOne({
      where: {
        studentId: dto.studentId,
        date: todayStr,
        prayer: dto.prayer,
      },
    });

    if (existingLog) {
      existingLog.status = dto.status;
      return await this.prayerRepository.save(existingLog);
    }

    const newLog = this.prayerRepository.create({
      studentId: dto.studentId,
      date: todayStr,
      prayer: dto.prayer,
      status: dto.status,
    });

    return await this.prayerRepository.save(newLog);
  }

  async getTodayPrayers(studentId: string): Promise<Prayer[]> {
    const todayStr = this.getTodayString();
    return await this.prayerRepository.find({
      where: {
        studentId,
        date: todayStr,
      },
    });
  }

  async getStudentPrayerReport(studentId: string, startDate: string, endDate: string): Promise<Prayer[]> {
    return await this.prayerRepository.find({
      where: {
        studentId,
        date: Between(startDate, endDate),
      },
      order: {
        date: 'ASC',
      },
    });
  }
}