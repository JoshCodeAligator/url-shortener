import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ShortUrl } from 'src/short-urls/short-url.entity';

@Entity('analytics')
export class Analytics {
  @PrimaryGeneratedColumn()
  auid: number;

  @OneToOne(() => ShortUrl, (url) => url.analytics, { onDelete: 'CASCADE' })
  @JoinColumn()
  shortUrl: ShortUrl;

  @Column({ default: 0 })
  totalRequests: number;

  @Column({ type: 'jsonb', default: {} })
  deviceTypeDistribution: Record<string, number>;

  @Column({ type: 'jsonb', default: {} })
  osTypeDistribution: Record<string, number>;

  @Column({ type: 'jsonb', default: {} })
  geographicalDistribution: Record<string, number>;

  @Column({ type: 'jsonb', default: {} })
  hourlyRequestDistribution: Record<string, number>;

  @Column({ type: 'jsonb', default: {} })
  referrerDomains: Record<string, number>;
}
