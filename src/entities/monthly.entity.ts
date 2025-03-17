import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ShortUrl } from 'src/short-urls/short-url.entity';

@Entity('monthly_request_counts')
export class MonthlyRequestCount {
  @PrimaryGeneratedColumn()
  mrc_id: number;

  @ManyToOne(() => ShortUrl, shortUrl => shortUrl.monthlyCounts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'suid' })
  shortUrl: ShortUrl;

  @Column()
  month_start_date: Date;

  @Column({ default: 0 })
  request_count: number;
}
