import { DataSource, Repository } from 'typeorm';
import {
  ConflictException,
  InternalServerErrorException,
  Injectable,
} from '@nestjs/common';
import { ShortUrl } from './short-url.entity';
import { CreateShortUrlDto } from './dto/create-short-url.dto';
import { User } from 'src/users/user.entity/user.entity';

@Injectable()
export class ShortUrlsRepository extends Repository<ShortUrl> {
  constructor(private dataSource: DataSource) {
    super(ShortUrl, dataSource.createEntityManager());
  }

  async createShortUrl(createShortUrlDto: CreateShortUrlDto, user: User): Promise<ShortUrl> {
    const { originalUrl, shortenedUrl } = createShortUrlDto;

    const shortUrl = this.create({ originalUrl, shortenedUrl, user });

    try {
      await this.save(shortUrl);
    } catch (err: any) {
      if (err.code === '23505') {
        throw new ConflictException('Shortened URL already exists');
      } else {
        throw new InternalServerErrorException('Failed to create Short URL');
      }
    }

    return shortUrl;
  }
}
