import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Role } from '../../core/constants/roles.enum';

@ApiTags('companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) { }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Create company' })
  @ApiResponse({ status: 201, description: 'The company has been successfully created.' })
  create(@Request() req: { user: { id: number, role: Role } }, @Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(req.user.id, createCompanyDto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get all companies' })
  @ApiResponse({ status: 200, description: 'Return all companies.' })
  findAll(@Request() req: { user: { id: number, role: Role } }) {
    // Si es admin, puede ver todas las companies, si es dealer solo las suyas
    const dealerId = req.user.role === Role.ADMIN ? undefined : req.user.id;
    return this.companiesService.findAll(dealerId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get company by id' })
  @ApiResponse({ status: 200, description: 'Return company by id.' })
  findOne(@Request() req: { user: { id: number, role: Role } }, @Param('id', ParseIntPipe) id: number) {
    const dealerId = req.user.role === Role.ADMIN ? undefined : req.user.id;
    return this.companiesService.findOne(id, dealerId);
  }

  @Patch(':server/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update company' })
  @ApiResponse({ status: 200, description: 'The company has been successfully updated.' })
  update(
    @Request() req: { user: { id: number, role: Role } },
    @Param('id', ParseIntPipe) id: number,
    @Param('server', ParseIntPipe) idServer: number,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(id, updateCompanyDto, idServer, req.user.id);
  }


  @Patch(':id/:folios/:server')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Add Folios Company' })
  @ApiResponse({ status: 200, description: 'Folios has been successfully add.' })
  addFolios(
    @Param('id', ParseIntPipe) id: number,
    @Param('folios', ParseIntPipe) folios: number,
    @Param('server', ParseIntPipe) server: number,
    @Request() req: { user: { id: number, role: Role } },
  ) {
    return this.companiesService.addFolios(id, folios, server, req.user.id);
  }

  @Get('validate-serial/:document/:serial')
  @ApiOperation({ summary: 'Validate cusoftSerial' })
  @ApiResponse({ status: 200, description: 'Folios has been successfully add.' })
  validateSerialCusoft(
    @Param('document', ParseIntPipe) document: string,
    @Param('serial') cusoftSerial: string,
  ) {
    return this.companiesService.validateSerial(document, cusoftSerial);
  }
}