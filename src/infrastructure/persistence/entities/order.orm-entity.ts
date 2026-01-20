import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('orders')
export class OrderOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'instrumentid' })
  instrumentId: number;

  @Column({ name: 'userid' })
  userId: number;

  @Column()
  size: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price: number;

  @Column({ length: 10 })
  type: string;

  @Column({ length: 10 })
  side: string;

  @Column({ length: 20 })
  status: string;

  @Column({ type: 'timestamp' })
  datetime: Date;
}
