import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { HttpService, } from '@nestjs/axios';

import { Shop } from './entities/shop.entity';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';

@Injectable()
export class ShopsService {
  constructor(
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) { }

  private async create(server: number, { name, companyId, cusoftSerial }: CreateShopDto) {


    let shop = await this.shopRepository.findOne({
      where: {
        name,
        company: {
          id: companyId
        }
      }
    });

    if (server === 2) {
      const shops = await this.getShop2();

      shop = shops?.find(s => s.name === name && s.company.id === companyId) ?? null;
    }

    if (shop) {
      throw new BadRequestException(`Tienda con nombre ${name} ya existe para esta compañia`)
    }

    const url = `${this.configService.get('externalServices.v') ?? ''}/shops`;

    if (server === 2) {
      try {
        const response = await firstValueFrom(
          this.httpService.post<Shop>(
            url,
            CreateShopDto,
            {
              headers: {
                'x-api-key': this.configService.get('externalServices.apiKey'),
              },
            }),
        );
        return response.data as Shop;
      } catch (error) {
        console.log(error);

        throw new BadRequestException(error.response.data.errors);
      }
    }

    const newShop = this.shopRepository.create({

      name,
      cusoftSerial,
      company: {
        id: companyId
      }
    });

    return this.shopRepository.save(newShop);
  }

  async update(id: number, updateShopDto: UpdateShopDto, idServer: number) {
    const shop = idServer === 1 ? await this.findOne(id) : await this.getShop2(id);

    if (shop) {
      const updatedCompany = {
        ...updateShopDto,
        company: updateShopDto.companyId ?
          { id: updateShopDto.companyId } : undefined,
      };

      if (idServer === 1) {
        await this.shopRepository.save({
          ...shop,
          ...updatedCompany,
        });
        return this.findOne(id)
      } else {
        await this.update2(id, updateShopDto);
        return this.getShop2(id);
      }

    } else {
      this.create(idServer, {
        companyId: updateShopDto?.companyId ?? 0,
        name: updateShopDto?.name ?? '',
        cusoftSerial: updateShopDto?.cusoftSerial ?? '',
      })
    }


  }

  private async findOne(id: number) {
    const queryBuilder = this.shopRepository
      .createQueryBuilder('shop')
      .leftJoinAndSelect('shop.company', 'company')
      .where('shop.id = :id', { id });

    const shop = await queryBuilder.getOne();

    if (!shop) {
      throw new NotFoundException(`Shop with ID ${id} not found`);
    }

    return shop;
  }

  private async getShop2(shopId?: number): Promise<Shop[] | null> {

    let url = `${this.configService.get('externalServices.externalURl') ?? ''}/shops`;
    if (shopId) {
      url += `/${shopId}`
    }

    const response = await firstValueFrom(
      this.httpService.get(url, {
        headers: {
          'x-api-key': this.configService.get('externalServices.apiKey'),
        },
      }),
    );

    if (response.data) {
      return response.data;
    }

    return null
  }

  private async update2(id: number, updateShopDto: UpdateShopDto) {

    const url = `${this.configService.get('externalServices.externalURl') ?? ''}/shops/${id}`;
    try {
      const response = await firstValueFrom(
        this.httpService.patch(url, updateShopDto, {
          headers: {
            'x-api-key': this.configService.get('externalServices.apiKey'),
          },
        }),
      );


      if (response.data) {
        return response.data;
      }
    } catch (error) {
      return error;

    }
  }
}
