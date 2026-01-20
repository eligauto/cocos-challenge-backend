import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('marketdata')
export class MarketDataOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'instrumentid' })
  instrumentId: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  high: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  low: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  open: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  close: number;

  @Column({ name: 'previousclose', type: 'numeric', precision: 10, scale: 2, nullable: true })
  previousClose: number;

  @Column({ type: 'date' })
  date: Date;
}
