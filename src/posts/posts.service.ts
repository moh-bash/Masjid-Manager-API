import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CloudinaryService } from '../common/servers/cloudinary/cloudinary.service';
import { Post } from './entities/post.entity';
import { Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(
    createPostDto: CreatePostDto,
    authorId: string,
    file?: Parameters<CloudinaryService['uploadFile']>[0],
  ): Promise<Post> {
    let imageUrl: string | undefined;

    if (file) {
      try {
        const uploadResult = await this.cloudinaryService.uploadFile(file);
        imageUrl = uploadResult.secure_url;
      } catch (error) {
        throw new InternalServerErrorException('فشل في رفع الصورة إلى الخادم');
      }
    } else {
      throw new BadRequestException('الصورة الرئيسية للمقال مطلوبة');
    }

    const baseSlug = createPostDto.title
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-أ-ي]/g, '');

    let uniqueSlug = baseSlug;
    let slugExists = await this.postsRepository.findOne({
      where: { slug: uniqueSlug },
    });
    let counter = 1;

    while (slugExists) {
      uniqueSlug = `${baseSlug}-${counter}`;
      slugExists = await this.postsRepository.findOne({
        where: { slug: uniqueSlug },
      });
      counter++;
    }

    const newPost = this.postsRepository.create({
      ...createPostDto,
      slug: uniqueSlug,
      image: imageUrl,
      authorId: authorId,
      categoryId: createPostDto.categoryId || undefined,
    });

    return await this.postsRepository.save(newPost);
  }

  async findAll() {
    const posts = await this.postsRepository.find({
      where: {isPublished: true},
      relations: {
        author: true,
        category: true,
      },
    });

    return {
      data: posts,
      total: posts.length,
    };
  }

  async findForAdmin() {
    const posts = await this.postsRepository.find({
      relations: {
        author: true,
        category: true,
      },
    });

    return {
      data: posts,
      total: posts.length,
    };
  }

  async findOne(slug: string) {
    const post = await this.postsRepository.findOne({
      where: { slug },
      relations: { author: true, category: true },
    });

    if (!post) {
      throw new BadRequestException('المقال غير موجود');
    }

    return post;
  }

  async update(
    id: string,
    updatePostDto: UpdatePostDto,
    file?: Parameters<CloudinaryService['uploadFile']>[0],
  ): Promise<Post> {
    const existingPost = await this.postsRepository.findOne({ where: { id } });
    console.log('Existing post:', existingPost);
    if (!existingPost) {
      throw new NotFoundException(`المقال غير موجود`);
    }

    let imageUrl = existingPost.image; 

    if (file) {
      try {
        const uploadResult = await this.cloudinaryService.uploadFile(file);
        imageUrl = uploadResult.secure_url;
      } catch (error) {
        throw new InternalServerErrorException(
          'فشل في رفع الصورة الجديدة إلى الخادم',
        );
      }
    }

    let finalSlug = existingPost.slug;
    if (updatePostDto.title && updatePostDto.title !== existingPost.title) {
      const baseSlug = updatePostDto.title
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-أ-ي]/g, '');

      finalSlug = baseSlug;
      let slugExists = await this.postsRepository.findOne({
        where: { slug: finalSlug, id: Not(id) },
      });
      let counter = 1;

      while (slugExists) {
        finalSlug = `${baseSlug}-${counter}`;
        slugExists = await this.postsRepository.findOne({
          where: { slug: finalSlug, id: Not(id) },
        });
        counter++;
      }
    }

    const updatedPost = await this.postsRepository.preload({
      id: id,
      ...updatePostDto,
      slug: finalSlug,
      image: imageUrl,
      categoryId: updatePostDto.categoryId || existingPost.categoryId, 
    });

    if (!updatedPost) {
      throw new NotFoundException(`المقال  غير موجود`);
    }

    return await this.postsRepository.save(updatedPost);
  }

  async remove(id: string) {
    await this.postsRepository.delete(id);
    return {masseg: "تم حذف المقال"}
  }
}
