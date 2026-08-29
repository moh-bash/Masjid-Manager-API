import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMosqueDto } from './dto/create-mosque.dto';
import { UpdateMosqueDto } from './dto/update-mosque.dto';
import { Mosque } from './entities/mosque.entity';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from '../users/enums/roles.enum';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Injectable()
export class MosqueService {
  constructor(
    @InjectRepository(Mosque)
    private readonly mosqueRepository: Repository<Mosque>,
    private usersService: UsersService,
  ) {}

  async create(dto: CreateMosqueDto) {
    const manager  = await this.usersService.findUserByEmail(
      dto.managerEmail,
    );

    if (!manager ) {
      throw new NotFoundException('User with this email does not exist');
    }

    if (!manager.role.includes(Role.MOSQUE_MANAGER)) {
      await this.usersService.addRoleToUser(manager , Role.MOSQUE_MANAGER);
    }

    const newMosque = {
      name: dto.name,
      location: {
        lat: dto.location.lat,
        lng: dto.location.lng,
      },
      manager: manager ,
    };

    const mosqueInstance = this.mosqueRepository.create(newMosque);
    const savedMosque = await this.mosqueRepository.save(mosqueInstance);
    return savedMosque;
  }

  async findAll(paginationQuery: PaginationQueryDto) {
    const { page = 1, limit = 10 } = paginationQuery;
    const skip = (page - 1) * limit;

    const [data, total] = await this.mosqueRepository.findAndCount({
      skip,
      take: limit,

      relations: {
        manager: true,
      },

      order: {
        name: 'DESC',
      }
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      }
    }
  }

  async findOne(id: string) {
    const mosque = await this.mosqueRepository.findOne({ 
      where: { id }, 
      relations: { manager: true },
      select: {
        id: true,
        name: true,
        location: true,
        createdAt: true,
        updatedAt: true,
        manager: {
          name: true,
          email: true,
          phoneNumber: true,
          createdAt: true,
        }
      }
    });

    if (!mosque) {
      throw new NotFoundException(`Mosque with ID ${id} not found`);
    }
    
    return mosque;
  }

  async findMyMosques(managerId: string) {
    const mosques = await this.mosqueRepository.find({
      where: { manager: { id: managerId } },
      relations: { manager: true },
      select: {
        id: true,
        name: true,
        manager: {
          id: true,
        }
      }
    });
    return mosques;
  }

  async update(id: string, updateMosqueDto: UpdateMosqueDto) {
    const mosque = await this.mosqueRepository.findOne({ where: { id } });

    if (!mosque) {
      throw new NotFoundException(`Mosque not found`);
    }

    Object.assign(mosque, updateMosqueDto);
    await this.mosqueRepository.save(mosque);
    return { message: 'تم التحديث بنجاح' };
  }

  async remove(id: string) {
    const mosque = await this.mosqueRepository.findOne({ where: { id } });
    if (!mosque) {
      throw new NotFoundException(`Mosque with ID ${id} not found`);
    }
    await this.mosqueRepository.delete(id);
    return { message: 'تم الحذف بنجاح' };
  }
}
