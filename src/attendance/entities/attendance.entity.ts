import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CircleSession } from './circle-session.entity';
import { Student } from '../../students/entities/student.entity';
import { AttendanceStatus } from '../enums/endance-status.enum';

@Entity('attendances')
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => CircleSession, (session) => session.attendances, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'session_id' })
  session!: CircleSession;

  @ManyToOne(() => Student, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'student_id' })
  student!: Student;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.PRESENT,
  })
  status!: AttendanceStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}