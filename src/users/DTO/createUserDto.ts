import {  IsArray, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
import { Role } from "../enums/roles.enum";

export class CreateUserDto {
    @IsNotEmpty()
    @IsString()
    name!: string;

    @IsNotEmpty()
    @IsEmail()
    email!: string;
    
    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    password!: string;
    
    @IsNotEmpty()
    @IsString()
    phoneNumber!: string;

    @IsOptional()
    @IsArray()
    role?: Role[];
}