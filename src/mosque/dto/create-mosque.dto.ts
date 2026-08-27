import { IsEmail, IsNotEmpty, IsObject, IsString } from "class-validator";


export class CreateMosqueDto {
    @IsNotEmpty()
    @IsString()
    name!: string;

    @IsNotEmpty()
    @IsEmail()
    managerEmail!: string;

    @IsNotEmpty()
    @IsObject()
    location!: {
        lat: number;
        lng: number;
    };
}
