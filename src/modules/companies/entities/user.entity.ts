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

    @Column({ name: 'api_token' })
    apiToken: string;

    @OneToMany(() => Company, company => company.user)
    companies: Company[];
}

