import { WeeklyRequestCount } from 'src/entities/weekly.entity';
import { MonthlyRequestCount } from 'src/entities/monthly.entity';
import { User } from 'src/users/user.entity';
import { Analytics } from 'src/entities/analytics.entity';


import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  CreateDateColumn,
  OneToOne,
} from 'typeorm';

@Entity('short_urls')
export class ShortUrl {
  @PrimaryGeneratedColumn()
  suid: number;

  @ManyToOne(() => User, (user) => user.shortUrls, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'text' })
  originalUrl: string;

  @Column({ unique: true })
  shortenedUrl: string;

  @CreateDateColumn({ name: 'date_created' })
  dateCreated: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'date_expired' })
  dateExpired?: Date;

  @OneToOne(() => Analytics, (analytics) => analytics.shortUrl)
  analytics: Analytics;

  @OneToMany(() => WeeklyRequestCount, (weekly) => weekly.shortUrl)
  weeklyCounts: WeeklyRequestCount[];

  @OneToMany(() => MonthlyRequestCount, (monthly) => monthly.shortUrl)
  monthlyCounts: MonthlyRequestCount[];
}
