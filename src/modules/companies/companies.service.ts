import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

    const validateFolios = await this.dealersService.validateFolios(dealerId, quantityFolios)

    if (!validateFolios) {
      throw new BadRequestException('Los folios son insuficientes para asignar al cliente')
    }

    const response = await firstValueFrom(
      this.httpService.get<ResponseCreateCompanyApidian>(`${this.configService.get('externalServices.apiDianURl') ?? ''}/${identificationNumber}/${dv} `, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        Body: {
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
          "mail_host": "smtp.gmail.com",
          "mail_port": "587",
          "mail_username": emailUsername,
          "mail_password": emailPassword,
          "mail_encryption": "tls"
        }
      }),
    );

    if (response.success === 'true') {
      const lastTypePlans = await this.typePlansRepository.findOne({
        order: {
          id: 1
        }
      })

      const typePlans = this.typePlansRepository.create({
        name: identificationNumber,
        qtyDocsInvoice: quantityFolios,
        id: (lastTypePlans?.id ?? 0) + 1,
        qtyDocsPayroll: 0,
        qtyDocsRadian: 0,
        qtyDocsDs: 0,
        period: 0,
        state: true,
      });


      const company = await this.findOne(response.company.id);
      const delaer = await this.dealersService.findById(dealerId);
      company.typePlans = typePlans;
      company.dealer = delaer;

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
      .leftJoinAndSelect('company.typePlans', 'typePlans');

    if (dealerId) {
      queryBuilder.where('dealer.id = :dealerId', { dealerId });
    }

    return queryBuilder.getMany();
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

  async update(id: number, updateCompanyDto: UpdateCompanyDto, dealerId?: number) {
    const company = await this.findOne(id, dealerId);

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

  async addFolios(companyId: number, newFolios: number) {
    const company = await this.findOne(companyId);

    const typePlans = await this.findOneTypePlan(company.typePlans.id);
    await this.typePlansRepository.save({
      ...typePlans,
      qtyDocsInvoice: typePlans.qtyDocsInvoice + newFolios,
    });

    return this.findOne(companyId);
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
}
