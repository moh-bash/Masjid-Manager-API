import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/users.entity';
import { Mosque } from '../../mosque/entities/mosque.entity';

@Entity('circles')
export class Circle {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', default: 1 })
  level!: number;

  @Column({ type: 'int', name: 'max_students', default: 20 })
  maxStudents!: number;

  @ManyToOne(() => Mosque, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'mosque_id' })
  mosque!: Mosque;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'teacher_id' })
  teacher!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}