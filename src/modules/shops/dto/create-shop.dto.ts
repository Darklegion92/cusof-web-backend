import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateShopDto {

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    cusoftSerial: string;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    companyId: number;
}