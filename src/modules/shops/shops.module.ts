import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DealersModule } from '../dealers/dealers.module';
import { HttpModule } from '@nestjs/axios';
import { Shop } from './entities/shop.entity';
import { ShopsController } from './shops.controller';
import { ShopsService } from './shops.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shop]),
    DealersModule,
    HttpModule

  ],
  controllers: [ShopsController],
  providers: [ShopsService],
  exports: [ShopsService],
})
export class ShopsModule { }