import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { Company } from './entities/company.entity';
import { TypePlans } from './entities/type-plans.entity';
import { DealersModule } from '../dealers/dealers.module';
import { HttpModule } from '@nestjs/axios';
import { User } from './entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, TypePlans, User]),
    DealersModule,
    HttpModule

  ],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule { }