import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Circle } from '../../circle/entities/circle.entity';
import { User } from '../../users/entities/users.entity';
import { Attendance } from './attendance.entity';

@Entity('circle_sessions')
export class CircleSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'date' })
  date!: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ManyToOne(() => Circle, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'circle_id' })
  circle!: Circle;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  createdBy?: User;

  @OneToMany(() => Attendance, (attendance) => attendance.session, {
    cascade: true, 
  })
  attendances!: Attendance[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}