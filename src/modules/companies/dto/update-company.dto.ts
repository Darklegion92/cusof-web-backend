import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateCompanyDto } from './create-company.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {
    @ApiProperty({ description: 'Se debe genera dependiendo de la cantidad de sucursales serialID1-fecha,serialID2-fecha' })
    @IsString()
    @IsOptional()
    serialCusoft: string;
}