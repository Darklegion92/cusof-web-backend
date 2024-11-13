import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Company } from './company.entity';


@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    email: string;

    @OneToMany(() => Company, company => company.dealer)
    companies: Company[];
}

