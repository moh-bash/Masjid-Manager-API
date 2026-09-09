import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { User } from '../../users/entities/users.entity';

@Entity('student_link_codes')
export class StudentLinkCode {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  code!: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'student_id' })
  student!: Student;

  @Column({ type: 'int', nullable: true, name: 'max_usages' })
  maxUsages!: number | null;

  @Column({ type: 'int', default: 0, name: 'current_usages' })
  currentUsages!: number;

  @Column({ type: 'timestamp', nullable: true, name: 'expires_at' })
  expiresAt!: Date | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy!: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}