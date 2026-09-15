import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { CloudinaryModule } from '../common/servers/cloudinary/cloudinary.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { PostCategory } from './entities/post-category.entity';

@Module({
  controllers: [PostsController],
  providers: [PostsService],
  imports: [
    TypeOrmModule.forFeature([Post, PostCategory]),
    AuthModule, 
    UsersModule, 
    CloudinaryModule
  ],
})
export class PostsModule {}
