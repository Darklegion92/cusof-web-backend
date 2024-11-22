import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';


@Entity('shops')
export class Shop {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ name: 'cusoft_serial' })
    cusoftSerial: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => Company, company => company.dealer)
    @JoinColumn({ name: 'company_id' })
    company: Company;
}

