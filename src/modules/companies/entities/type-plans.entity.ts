import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Company } from './company.entity';

@Entity('type_plans')
export class TypePlans {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ name: 'qty_docs_invoice' })
  qtyDocsInvoice: number;

  @Column({ name: 'qty_docs_payroll' })
  qtyDocsPayroll: number;

  @Column({ name: 'qty_docs_radian' })
  qtyDocsRadian: number;

  @Column({ name: 'qty_docs_ds' })
  qtyDocsDs: number;

  @Column()
  period: number;

  @Column()
  state: boolean;

  @Column()
  observations: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Company, company => company.typePlans)
  companies: Company[];

}

