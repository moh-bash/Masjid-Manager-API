import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { CircleSession } from '../../attendance/entities/circle-session.entity';
import { User } from '../../users/entities/users.entity';

@Entity('recitations')
export class Recitation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  suraNumber!: number;

  @Column({ type: 'int' })
  startAyah!: number;

  @Column({ type: 'int' })
  endAyah!: number;

  @Column({ type: 'int' })
  score!: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'student_id' })
  student!: Student;

  @ManyToOne(() => CircleSession, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'session_id' })
  session!: CircleSession;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'teacher_id' })
  teacher?: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
