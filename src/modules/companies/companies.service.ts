import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as dayjs from 'dayjs';
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
      .leftJoinAndSelect('company.shops', 'shop')
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
      .leftJoinAndSelect('company.user', 'user')
      .leftJoinAndSelect('company.shops', 'shop')
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

  async findDocument(document: string) {
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
      .leftJoinAndSelect('company.shops', 'shop')
      .where('company.identificationNumber = :document', { document });

    return queryBuilder.getOne();

  }

  async update(id: number, updateCompanyDto: UpdateCompanyDto, idServer: number, dealerId?: number) {
    const company = idServer === 1 ? await this.findOne(id, dealerId) : await this.getCompany2(id);

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

    if (idServer === 1) {
      await this.companyRepository.save({
        ...company,
        ...updatedCompany,
      });
      return this.findOne(id, dealerId)
    } else {
      await this.update2(id, updateCompanyDto);
      return this.getCompany2(id);
    }


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

  private async getCompany2(companyId?: number) {

    let url = `${this.configService.get('externalServices.externalURl') ?? ''}/companies`;
    if (companyId) {
      url += `/${companyId}`
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

  private async update2(id: number, updateCompanyDto: UpdateCompanyDto) {

    const url = `${this.configService.get('externalServices.externalURl') ?? ''}/companies/${id}`;
    try {
      const response = await firstValueFrom(
        this.httpService.patch(url, updateCompanyDto, {
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

  async validateSerial(document: string, cusoftSerial: string) {

    let company: Company | null = await this.findDocument(document);

    if (!company) {
      const companies: Company[] = await this.getCompany2();

      company = companies.find(c => c.identificationNumber == document) ?? null;

      if (!company) {
        throw new BadRequestException('Compañia no existe')
      }
    }

    const cusoftSerials = company.shops.map(s => ({ cusoftSerial: s.cusoftSerial, date: s.createdAt }));

    const serialFind = cusoftSerials.find((s) => s.cusoftSerial === cusoftSerial);

    if (!serialFind) {
      throw new UnauthorizedException('Serial no registado o incorrecto')
    }

    const dateSerial = dayjs(serialFind.date).add(1, 'y');

    if (dateSerial.isBefore(dayjs())) {
      throw new ForbiddenException('Fecha caducada para el serial')
    }

    return company;
  }
}
