import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ShortUrl } from 'src/short-urls/short-url.entity';

@Entity('weekly_request_counts')
export class WeeklyRequestCount {
  @PrimaryGeneratedColumn()
  wrc_id: number;

  @ManyToOne(() => ShortUrl, shortUrl => shortUrl.weeklyCounts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'suid' })
  shortUrl: ShortUrl;

  @Column()
  week_start_date: Date;

  @Column({ default: 0 })
  request_count: number;
}
