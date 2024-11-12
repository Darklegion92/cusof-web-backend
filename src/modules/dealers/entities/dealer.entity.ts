import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { Role } from '../../../core/constants/roles.enum';

@Entity('dealers')
export class Dealer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  phone: string;

  @Column({ default: 0, name: 'folios_acquired' })
  foliosAcquired: number;

  @Column({ default: 0, name: 'used_folios' })
  usedFolios: number;

  @Column({ default: 0, name: "customers_count" })
  customersCount: number;

  @Column({ default: true, name: "is_active" })
  isActive: boolean;

  @Column({ type: 'enum', enum: Role, default: Role.DEALER })
  role: Role;

  @Column({ nullable: true, name: 'refresh_token' })
  refreshToken: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Company, company => company.dealer)
  companies: Company[];
}