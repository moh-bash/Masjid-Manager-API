import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './DTO/createUserDto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/users.entity';
import { Repository } from 'typeorm';
import { Role } from './enums/roles.enum';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>
    ) {}

    // find user by email
    async findUserByEmail(email: string) {
        const user = await this.userRepository.findOne({where: {email}});
        return user;
    }

    // create user
    async createUser(newUser: CreateUserDto) {
            const isUserExist = await this.findUserByEmail(newUser.email);
            if(isUserExist){
                throw new ConflictException('User with this email already exists');
            }

            const userInstance = this.userRepository.create(newUser);
            const savedUser = await this.userRepository.save(userInstance);
     
            const {password, ...resolt} = savedUser;
            return resolt;
    }

    // get All users
    async getAllUsers() {
        const users = await this.userRepository.find();
        const result = users.map(user => {
            const {password, ...resolt} = user;
            return resolt;
        });
        return result;
    }

    // get user by id
    async getUserById(id: string) {
        const user = await this.userRepository.findOne({where: {id}});
        if(!user) {
            throw new ConflictException('User not found');
        }
        const {password, ...resolt} = user;
        return resolt;
    }

    // update user by id
    // delete user by id

    // add role to user
    async addRoleToUser(user: User, newRole :Role) {
        if(!user.role.includes(newRole)){
            user.role.push(newRole);
        }
        const updatedUser = await this.userRepository.save(user);
        return updatedUser;
    }
}
