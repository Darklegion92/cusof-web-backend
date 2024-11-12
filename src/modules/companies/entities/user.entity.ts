import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column({ name: 'email_verified_at' })
  emailVerifiedAt: Date;

  @Column()
  password: string;

  @Column({ name: 'api_token' })
  apiToken: string;

  @Column({ name: 'remember_token' })
  rememberToken: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'id_administrator' })
  idAdministrator: number;

  @Column({ name: 'mail_host' })
  mailHost: string;

  @Column({ name: 'mail_port' })
  mailPort: string;

  @Column({ name: 'mail_username' })
  mailUsername: string;

  @Column({ name: 'mail_password' })
  mailPassword: string;

  @Column({ name: 'mail_encryption' })
  mailEncryption: string;
}

