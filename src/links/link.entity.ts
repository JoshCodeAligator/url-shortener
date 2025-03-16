import { User } from 'src/users/user.entity/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity()
export class Link {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  url: string;

  @ManyToOne(() => User, user => user.shortUrls, { onDelete: 'CASCADE' }) 
  user: User;
}
