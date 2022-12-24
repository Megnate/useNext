import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity({ name: 'user' })
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 300 })
  name: string;

  @Column({ type: 'varchar', length: 300 })
  mobile: string;

  @Column({ type: 'varchar', length: 300 })
  password: string;

  @Column({ type: 'varchar', length: 300 })
  address: string;

  @Column({ type: 'varchar', length: 300 })
  salt: string;
}
