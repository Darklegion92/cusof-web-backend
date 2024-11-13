import { IsString, IsNumber, IsNotEmpty, IsEmail, MinLength, IsOptional, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCompanyDto {

  @ApiProperty()
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  identificationNumber: string;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  dv: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  typeDocumentIdentificationId: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  typeOrganizationId: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  typeRegimeId: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  typePlanId: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  typeLiabilityId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  merchantRegistration: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  municipalityId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsEmail()
  @IsOptional()
  emailUsername: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  emailPassword: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  quantityFolios: number;
}
