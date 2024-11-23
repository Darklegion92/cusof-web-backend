import { BadRequestException, Injectable } from '@nestjs/common';
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
      return new BadRequestException(`Tienda con nombre ${name} ya existe para esta compañia`)
    }


    if (server === 2) {
      try {
        const url = `${this.configService.get('externalServices.externalURl') ?? ''}/shops`;
        const response = await firstValueFrom(
          this.httpService.post<Shop>(
            url,
            { name, companyId, cusoftSerial },
            {
              headers: {
                'x-api-key': this.configService.get('externalServices.apiKey'),
              },
            }),
        );

        return response.data as Shop;
      } catch (error) {
        console.log({ error });

        return new BadRequestException(error);
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
    let shop = await this.findOne(id);

    if (idServer === 2) {
      const shops = await this.getShop2(id) ?? [];
      shop = shops[0]
    }

    if (shop) {
      if (idServer === 1) {
        const updatedCompany = {
          ...updateShopDto,
          company: updateShopDto.companyId ?
            { id: updateShopDto.companyId } : undefined,
        };
        await this.shopRepository.save({
          ...shop,
          ...updatedCompany,
        });
        return this.findOne(id)
      } else {
        await this.update2(id, updateShopDto);
        const shops = await this.getShop2(id) as Shop[];
        return shops[0];
      }

    } else {
      return this.create(idServer, {
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

    return queryBuilder.getOne();
  }

  private async getShop2(shopId?: number): Promise<Shop[] | null> {

    let url = `${this.configService.get('externalServices.externalURl') ?? ''}/shops`;
    if (shopId || shopId === 0) {
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
