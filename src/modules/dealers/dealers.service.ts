import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Dealer } from './entities/dealer.entity';
import { CreateDealerDto } from './dto/create-dealer.dto';
import { UpdateDealerDto } from './dto/update-dealer.dto';
import { Role } from '../../core/constants/roles.enum';

@Injectable()
export class DealersService {
  constructor(
    @InjectRepository(Dealer)
    private readonly dealerRepository: Repository<Dealer>,
  ) { }

  async create(createDealerDto: CreateDealerDto, role: Role = Role.DEALER) {
    const existingDealer = await this.findByEmail(createDealerDto.email);
    if (existingDealer) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createDealerDto.password, 10);

    const dealer = this.dealerRepository.create({
      ...createDealerDto,
      password: hashedPassword,
      role,
      foliosAcquired: 0,
      customersCount: 0,
    });

    return this.dealerRepository.save(dealer);
  }

  async findAll() {
    return this.dealerRepository.find({
      select: ['id', 'name', 'email', 'phone', 'foliosAcquired', 'customersCount', 'isActive', 'createdAt', 'updatedAt'],
    });
  }

  async findById(id: number) {
    const dealer = await this.dealerRepository.findOne({
      where: { id },
      select: ['id', 'name', 'email', 'phone', 'foliosAcquired', 'customersCount', 'isActive', 'role', 'createdAt', 'updatedAt', 'refreshToken'],
    });

    if (!dealer) {
      throw new NotFoundException(`Dealer with ID ${id} not found`);
    }

    return dealer;
  }

  async findByEmail(email: string) {
    return this.dealerRepository.findOne({
      where: { email },
      select: ['id', 'name', 'email', 'password', 'phone', 'foliosAcquired', 'customersCount', 'isActive', 'role', 'refreshToken'],
    });
  }

  async update(id: number, updateDealerDto: UpdateDealerDto) {
    const dealer = await this.findById(id);

    if (updateDealerDto.email && updateDealerDto.email !== dealer.email) {
      const existingDealer = await this.findByEmail(updateDealerDto.email);
      if (existingDealer) {
        throw new ConflictException('Email already exists');
      }
    }

    if (updateDealerDto.password) {
      updateDealerDto.password = await bcrypt.hash(updateDealerDto.password, 10);
    }

    await this.dealerRepository.update(id, updateDealerDto);
    return this.findById(id);
  }

  async setRefreshToken(id: number, refreshToken: string) {
    await this.dealerRepository.update(id, {
      refreshToken: refreshToken,
    });
  }

  async updateFoliosCount(id: number, foliosCount: number) {
    const dealer = await this.findById(id);
    dealer.foliosAcquired += foliosCount;
    return this.dealerRepository.save(dealer);
  }

  async updateClientsCount(id: number, clientsCount: number) {
    const dealer = await this.findById(id);
    dealer.customersCount = clientsCount;
    return this.dealerRepository.save(dealer);
  }

  async toggleActive(id: number) {
    const dealer = await this.findById(id);
    dealer.isActive = !dealer.isActive;
    return this.dealerRepository.save(dealer);
  }

  async validateFolios(dealerId: number, quantity: number): Promise<boolean> {

    const dealer = await this.findById(dealerId);

    return (dealer.foliosAcquired - dealer.usedFolios) >= quantity

  }
}
