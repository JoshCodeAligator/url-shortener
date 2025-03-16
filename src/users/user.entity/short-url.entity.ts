import { Link } from 'src/links/link.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, CreateDateColumn, OneToOne } from 'typeorm';
import { User } from './user.entity';
import { Analytics } from './analytics.entity';

@Entity('short_urls')
export class ShortUrl {
  @PrimaryGeneratedColumn()
  suid: number;

  @ManyToOne(() => User, user => user.shortUrls, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'text' })
  originalUrl: string;

  @Column({ unique: true })
  shortenedUrl: string;

  @CreateDateColumn({ name: 'date_created' })
  dateCreated: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'date_expired' })
  dateExpired?: Date;

  @OneToOne(() => Analytics, analytics => analytics.shortUrl)
  analytics: Analytics;
}
