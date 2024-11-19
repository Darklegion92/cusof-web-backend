import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import dayjs from 'dayjs';
import { Company } from './entities/company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { TypePlans } from './entities/type-plans.entity';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { HttpService, } from '@nestjs/axios';
import { ResponseCreateCompanyApidian } from './dto/response-create-company-apidian';
import { DealersService } from '../dealers/dealers.service';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(TypePlans)
    private readonly typePlansRepository: Repository<TypePlans>,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly dealersService: DealersService
  ) { }

  async create(dealerId: number, { quantityFolios, typeRegimeId, address, businessName, dv, email, emailPassword, emailUsername, identificationNumber, merchantRegistration, municipalityId, phone, typeDocumentIdentificationId, typeLiabilityId, typeOrganizationId, }: CreateCompanyDto) {


    const company = await this.companyRepository.findOne({
      where: {
        identificationNumber
      }
    })

    if (company) {
      throw new BadRequestException(`Cliente con documento ${identificationNumber} ya existe`)
    }

    const validateFolios = await this.dealersService.validateFolios(dealerId, quantityFolios)

    if (!validateFolios) {
      throw new BadRequestException('Los folios son insuficientes para asignar al cliente')
    }

    const url = `${this.configService.get('externalServices.apiDianURl') ?? ''}/config/${identificationNumber}/${dv} `;

    let response;
    try {
      response = await firstValueFrom(
        this.httpService.post<ResponseCreateCompanyApidian>(
          url,
          {
            "type_document_identification_id": typeDocumentIdentificationId,
            "type_organization_id": typeOrganizationId,
            "type_regime_id": typeRegimeId,
            "type_liability_id": typeLiabilityId,
            "business_name": businessName,
            "merchant_registration": merchantRegistration,
            "municipality_id": municipalityId,
            "address": address,
            "phone": phone,
            "email": email,
            "mail_host": emailUsername ? "smtp.gmail.com" : null,
            "mail_port": emailUsername ? "587" : null,
            "mail_username": emailUsername,
            "mail_password": emailPassword,
            "mail_encryption": emailUsername ? "tls" : null

          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          }),
      );
    } catch (error) {
      console.log(error);

      throw new BadRequestException(error.response.data.errors);
    }

    if (response.data.success) {
      const lastTypePlans = await this.typePlansRepository.find({
        order: { id: 'DESC' },
        take: 1
      })

      const typePlans = this.typePlansRepository.create({
        name: identificationNumber,
        qtyDocsInvoice: quantityFolios,
        id: (lastTypePlans[0]?.id ?? 0) + 1,
        qtyDocsPayroll: 0,
        qtyDocsRadian: 0,
        qtyDocsDs: 0,
        period: 0,
        state: true,
      });


      await this.typePlansRepository.save(typePlans);


      const company = await this.findOne(response.data.company.id);
      const dealer = await this.dealersService.findById(dealerId);
      company.typePlans = typePlans;
      company.dealer = dealer;

      await this.dealersService.update(dealer.id, {
        usedFolios: dealer.usedFolios + quantityFolios
      });

      return this.companyRepository.save(company);
    } else {
      throw new BadRequestException('Error al crear la compañia')
    }

  }

  async findAll(dealerId?: number) {
    const queryBuilder = this.companyRepository
      .createQueryBuilder('company')
      .leftJoinAndSelect('company.typeDocumentIdentification', 'typeDocumentIdentification')
      .leftJoinAndSelect('company.typeOrganization', 'typeOrganization')
      .leftJoinAndSelect('company.typeRegime', 'typeRegime')
      .leftJoinAndSelect('company.typeLiability', 'typeLiability')
      .leftJoinAndSelect('company.municipality', 'municipality')
      .leftJoinAndSelect('company.dealer', 'dealer')
      .leftJoinAndSelect('company.typePlans', 'typePlans')
      .leftJoinAndSelect('company.user', 'user')
      .where('type_plan_id <> 0');

    if (dealerId) {
      queryBuilder.andWhere('dealer.id = :dealerId', { dealerId });
    }
    const companies = await queryBuilder.getMany();

    const companies2 = await this.getCompanies2(dealerId ?? 0);

    return [...companies, ...companies2];
  }

  async findOne(id: number, dealerId?: number) {
    const queryBuilder = this.companyRepository
      .createQueryBuilder('company')
      .leftJoinAndSelect('company.typeDocumentIdentification', 'typeDocumentIdentification')
      .leftJoinAndSelect('company.typeOrganization', 'typeOrganization')
      .leftJoinAndSelect('company.typeRegime', 'typeRegime')
      .leftJoinAndSelect('company.typeLiability', 'typeLiability')
      .leftJoinAndSelect('company.municipality', 'municipality')
      .leftJoinAndSelect('company.dealer', 'dealer')
      .leftJoinAndSelect('company.typePlans', 'typePlans')
      .where('company.id = :id', { id });

    if (dealerId) {
      queryBuilder.andWhere('dealer.id = :dealerId', { dealerId });
    }

    const company = await queryBuilder.getOne();

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    return company;
  }

  async update(id: number, { cusoftSerial: serialCusoft, ...updateCompanyDto }: UpdateCompanyDto, dealerId?: number) {
    const company = await this.findOne(id, dealerId);

    if (serialCusoft) {

      const cusoftSerials = serialCusoft.split(',');

      if (cusoftSerials.length > company.quantityShops) {
        throw new BadRequestException(`La cantidad de sucurasles no puede superar ${company.quantityShops}`)
      }
    }

    const updatedCompany = {
      ...updateCompanyDto,
      typeDocumentIdentification: updateCompanyDto.typeDocumentIdentificationId ?
        { id: updateCompanyDto.typeDocumentIdentificationId } : undefined,
      typeOrganization: updateCompanyDto.typeOrganizationId ?
        { id: updateCompanyDto.typeOrganizationId } : undefined,
      typeRegime: updateCompanyDto.typeRegimeId ?
        { id: updateCompanyDto.typeRegimeId } : undefined,
      typeLiability: updateCompanyDto.typeLiabilityId ?
        { id: updateCompanyDto.typeLiabilityId } : undefined,
      municipality: updateCompanyDto.municipalityId ?
        { id: updateCompanyDto.municipalityId } : undefined,
    };

    await this.companyRepository.save({
      ...company,
      ...updatedCompany,
    });

    return this.findOne(id, dealerId);
  }

  async addFolios(companyId: number, newFolios: number, server: number, dealerId: number) {

    const validateFolios = await this.dealersService.validateFolios(dealerId, newFolios);

    if (!validateFolios) {
      throw new BadRequestException("El distribuidor no tiene suficientes folios")
    }

    let companyReturn;

    if (server === 1) {
      const company = await this.findOne(companyId);

      const typePlans = await this.findOneTypePlan(company.typePlans.id);
      await this.typePlansRepository.save({
        ...typePlans,
        qtyDocsInvoice: typePlans.qtyDocsInvoice + newFolios,
        state: true
      });

      companyReturn = this.findOne(companyId);
    } else {
      const url = `${this.configService.get('externalServices.externalURl') ?? ''}/companies/${companyId}/${newFolios}`;
      try {
        const response = await firstValueFrom(
          this.httpService.patch(url, {}, {
            headers: {
              'x-api-key': this.configService.get('externalServices.apiKey'),
            },
          }),
        );


        if (response.data) {
          companyReturn = response.data;
        }
      } catch (error) {
        return error;

      }
    }

    const dealer = await this.dealersService.findById(dealerId);

    await this.dealersService.update(dealerId, {
      usedFolios: dealer.usedFolios + newFolios
    });

    return companyReturn;

  }


  private async findOneTypePlan(id: number) {

    const queryBuilder = this.typePlansRepository
      .createQueryBuilder('type-plans')
      .where('type-plans.id = :id', { id });

    const typePlans = await queryBuilder.getOne();

    if (!typePlans) {
      throw new NotFoundException(`typePlans with ID ${id} not found`);
    }

    return typePlans;
  }

  private async getCompanies2(dealerId: number) {

    const url = `${this.configService.get('externalServices.externalURl') ?? ''}/companies/${dealerId}`;

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

    return []
  }

  async validateSerial(id: number, cusoftSerial: string) {

    const company = await this.findOne(id);
    const cusoftSerials = company.cusoftSerial.split(',');

    const serialFind = cusoftSerials.find((serial) => serial === cusoftSerial);

    if (!serialFind) {
      return new UnauthorizedException('Serial no registado o incorrecto')
    }

    const dateSerial = dayjs(serialFind.split('-')[0]);

    if (dateSerial.isAfter(dayjs())) {
      return new UnauthorizedException('Fecha caducada para el serial')

    }

    return company;
  }
}
