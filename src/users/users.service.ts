import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './DTO/createUserDto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/users.entity';
import { Repository } from 'typeorm';
import { Role } from './enums/roles.enum';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // find user by email
  async findUserByEmail(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    return user;
  }

  // create user
  async createUser(newUser: CreateUserDto) {
    const isUserExist = await this.findUserByEmail(newUser.email);
    if (isUserExist) {
      throw new ConflictException('User with this email already exists');
    }

    const userInstance = this.userRepository.create(newUser);
    const savedUser = await this.userRepository.save(userInstance);

    const { password, ...resolt } = savedUser;
    return resolt;
  }

  // get All users
  async getAllUsers(paginationQuery: PaginationQueryDto) {
    const { page = 1, limit = 10 } = paginationQuery;
    const skip = (page - 1) * limit;

    const [data, total] = await this.userRepository.findAndCount({
      skip,
      take: limit,
      order: {
        name: 'DESC',
      },
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
      },
    };
  }

  // get user by id
  async getUserById(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new ConflictException('User not found');
    }
    const { password, ...resolt } = user;
    return resolt;
  }

  // update user by id
  // delete user by id

  // add role to user
  async addRoleToUser(user: User, newRole: Role) {
    if (!user.role.includes(newRole)) {
      user.role.push(newRole);
    }
    const updatedUser = await this.userRepository.save(user);
    return updatedUser;
  }
}
