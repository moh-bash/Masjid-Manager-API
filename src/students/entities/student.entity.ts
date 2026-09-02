import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Mosque } from '../../mosque/entities/mosque.entity';
import { User } from '../../users/entities/users.entity';
import { StudentCircle } from './student-circle.entity';
import { OrphanStatus } from '../enums/orphan-status.enum';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'date', name: 'date_of_birth' })
  dateOfBirth!: Date;

  @Column({ name: 'mother_name' })
  motherName!: string;

  @Column({
    type: 'enum',
    enum: OrphanStatus,
    default: OrphanStatus.NONE,
    name: 'orphan_status',
  })
  orphanStatus!: OrphanStatus;

  @Column({ type: 'date', name: 'registration_date' })
  registrationDate!: Date;

  @ManyToOne(() => Mosque, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'mosque_id' })
  mosque!: Mosque;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent?: User;

  @OneToMany(() => StudentCircle, (studentCircle) => studentCircle.student)
  circleHistory!: StudentCircle[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  get age(): number {
    if (!this.dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  }
}