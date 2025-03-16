import { Link } from 'src/links/link.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ShortUrl } from './short-url.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  uid: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ default: false })
  isAdmin: boolean;

  @OneToMany(() => ShortUrl, url => url.user)
  shortUrls: ShortUrl[];
}
