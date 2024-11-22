import {
  Controller,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Role } from '../../core/constants/roles.enum';
import { ShopsService } from './shops.service';
import { UpdateShopDto } from './dto/update-shop.dto';

@ApiTags('shops')
@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) { }

  @Patch(':server/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update company' })
  @ApiResponse({ status: 200, description: 'The company has been successfully updated.' })
  update(
    @Request() req: { user: { id: number, role: Role } },
    @Param('id', ParseIntPipe) id: number,
    @Param('server', ParseIntPipe) idServer: number,
    @Body() updateShopDto: UpdateShopDto,
  ) {
    return this.shopsService.update(id, updateShopDto, idServer);
  }
}