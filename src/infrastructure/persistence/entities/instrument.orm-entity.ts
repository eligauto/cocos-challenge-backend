import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('instruments')
export class InstrumentOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 10 })
  ticker: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 10 })
  type: string;
}
