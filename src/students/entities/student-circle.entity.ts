import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Student } from './student.entity';
import { Circle } from '../../circle/entities/circle.entity';

@Entity('student_circles')
export class StudentCircle {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Student, (student) => student.circleHistory, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'student_id' })
  student!: Student;

  @ManyToOne(() => Circle, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'circle_id' })
  circle!: Circle;

  @Column({ type: 'date', name: 'join_date' })
  joinDate!: Date;

  @Column({ type: 'date', name: 'leave_date', nullable: true })
  leaveDate!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}