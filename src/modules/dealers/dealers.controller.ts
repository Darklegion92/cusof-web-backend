import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  ParseIntPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DealersService } from './dealers.service';
import { CreateDealerDto } from './dto/create-dealer.dto';
import { UpdateDealerDto } from './dto/update-dealer.dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { Role } from '../../core/constants/roles.enum';

@ApiTags('dealers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dealers')
export class DealersController {
  constructor(private readonly dealersService: DealersService) { }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create dealer' })
  @ApiResponse({ status: 201, description: 'The dealer has been successfully created.' })
  create(@Body() createDealerDto: CreateDealerDto) {
    return this.dealersService.create(createDealerDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all dealers' })
  @ApiResponse({ status: 200, description: 'Return all dealers.' })
  findAll() {
    return this.dealersService.findAll();
  }

  @Get(':id')
  @Roles(Role.DEALER)
  @ApiOperation({ summary: 'Get dealer by id' })
  @ApiResponse({ status: 200, description: 'Return dealer by id.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.dealersService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.DEALER)
  @ApiOperation({ summary: 'Update dealer' })
  @ApiResponse({ status: 200, description: 'The dealer has been successfully updated.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDealerDto: UpdateDealerDto,
  ) {
    return this.dealersService.update(id, updateDealerDto);
  }

  @Patch(':id/folios-add')
  @Roles(Role.DEALER)
  @ApiOperation({ summary: 'Update dealer folios count' })
  @ApiResponse({ status: 200, description: 'The dealer folios count has been successfully updated.' })
  updateFolios(
    @Param('id', ParseIntPipe) id: number,
    @Body('foliosCount', ParseIntPipe) foliosCount: number,
  ) {
    return this.dealersService.updateFoliosCount(id, foliosCount);
  }

  @Patch(':id/clients-add')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update dealer clients count' })
  @ApiResponse({ status: 200, description: 'The dealer clients count has been successfully updated.' })
  updateClients(
    @Param('id', ParseIntPipe) id: number,
    @Body('clientsCount', ParseIntPipe) clientsCount: number,
  ) {
    return this.dealersService.updateClientsCount(id, clientsCount);
  }

  @Patch(':id/toggle-active')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Toggle dealer active status' })
  @ApiResponse({ status: 200, description: 'The dealer active status has been successfully toggled.' })
  toggleActive(@Param('id', ParseIntPipe) id: number) {
    return this.dealersService.toggleActive(id);
  }
}