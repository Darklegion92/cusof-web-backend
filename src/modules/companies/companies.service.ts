import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './entities/company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) { }

  async create(dealerId: number, createCompanyDto: CreateCompanyDto) {
    const company = this.companyRepository.create({
      ...createCompanyDto,
      dealer: { id: dealerId },
      typeDocumentIdentification: { id: createCompanyDto.type_document_identification_id },
      typeOrganization: { id: createCompanyDto.type_organization_id },
      typeRegime: { id: createCompanyDto.type_regime_id },
      typeLiability: { id: createCompanyDto.type_liability_id },
      municipality: { id: createCompanyDto.municipality_id },
    });

    return this.companyRepository.save(company);
  }

  async findAll(dealerId?: number) {
    const queryBuilder = this.companyRepository
      .createQueryBuilder('company')
      .leftJoinAndSelect('company.typeDocumentIdentification', 'typeDocumentIdentification')
      .leftJoinAndSelect('company.typeOrganization', 'typeOrganization')
      .leftJoinAndSelect('company.typeRegime', 'typeRegime')
      .leftJoinAndSelect('company.typeLiability', 'typeLiability')
      .leftJoinAndSelect('company.municipality', 'municipality')
      .leftJoinAndSelect('company.dealer', 'dealer');

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

  async update(id: number, dealerId: number, updateCompanyDto: UpdateCompanyDto) {
    const company = await this.findOne(id, dealerId);

    const updatedCompany = {
      ...updateCompanyDto,
      typeDocumentIdentification: updateCompanyDto.type_document_identification_id ?
        { id: updateCompanyDto.type_document_identification_id } : undefined,
      typeOrganization: updateCompanyDto.type_organization_id ?
        { id: updateCompanyDto.type_organization_id } : undefined,
      typeRegime: updateCompanyDto.type_regime_id ?
        { id: updateCompanyDto.type_regime_id } : undefined,
      typeLiability: updateCompanyDto.type_liability_id ?
        { id: updateCompanyDto.type_liability_id } : undefined,
      municipality: updateCompanyDto.municipality_id ?
        { id: updateCompanyDto.municipality_id } : undefined,
    };

    await this.companyRepository.save({
      ...company,
      ...updatedCompany,
    });

    return this.findOne(id, dealerId);
  }

  async addFolios(companyId: number, newFolios: number) {

    //TODO: agregar actualizarción de folios
    return this.findOne(companyId);
  }
}
