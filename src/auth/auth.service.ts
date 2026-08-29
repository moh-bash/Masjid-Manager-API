import * as bcrypt from 'bcrypt';
import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/DTO/createUserDto';
import { AuthLoginDto } from './DTO/authLoginDto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(user: CreateUserDto) {
    const SaltRounds = 10;
    const hashPassword = await bcrypt.hash(user.password, SaltRounds);
    const newUser = {
      name: user.name,
      email: user.email,
      password: hashPassword,
      phoneNumber: user.phoneNumber,
      role: user.role,
    };
    const createdUser = await this.usersService.createUser(newUser);
    const payload = { userId: createdUser.id };
    const token = await this.generateJWT(payload);
    return { token };
  }

  async login(user: AuthLoginDto) {
    const foundUser = await this.usersService.findUserByEmail(user.email);
    if (!foundUser) {
      throw new BadRequestException('Invalid email or password');
    }
    const isPasswordValid = await bcrypt.compare(
      user.password,
      foundUser.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid email or password');
    }
    const token = await this.generateJWT({ userId: foundUser.id });
    const role = foundUser.role;
    return { token, role };
  }

  private async generateJWT(payload: any) {
    return this.jwtService.signAsync(payload);
  }
}
