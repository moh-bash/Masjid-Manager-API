import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { PrayerName, PrayerStatus } from '../enums/prayer.enum';

@Entity('prayers')
@Unique(['studentId', 'date', 'prayer'])
export class Prayer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  studentId!: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student!: Student;

  @Column({ type: 'date' })
  date!: string; 

  @Column({
    type: 'enum',
    enum: PrayerName,
  })
  prayer!: PrayerName;

  @Column({
    type: 'enum',
    enum: PrayerStatus,
  })
  status!: PrayerStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}