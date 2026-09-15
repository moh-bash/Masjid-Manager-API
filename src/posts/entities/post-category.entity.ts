import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  OneToMany, 
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';
import { Post } from './post.entity';

@Entity('post_categories')
export class PostCategory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string; 

  @Column({ type: 'varchar', length: 120, unique: true })
  slug!: string; 

  @OneToMany(() => Post, (post) => post.category)
  posts!: Post[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}