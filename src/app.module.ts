import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import configuration from './config/configuration';
import { getDatabaseConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { DealersModule } from './modules/dealers/dealers.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { ShopsModule } from './modules/shops/shops.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: getDatabaseConfig,
            inject: [ConfigService],
        }),
        AuthModule,
        DealersModule,
        CompaniesModule,
        CatalogModule,
        ShopsModule
    ],
})
export class AppModule { }