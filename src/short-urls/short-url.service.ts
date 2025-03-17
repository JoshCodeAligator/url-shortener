import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShortUrl } from './short-url.entity';
import { CreateShortUrlDto } from './dto/create-short-url.dto';
import { UpdateShortUrlDto } from './dto/update-short-url.dto';
import { User } from 'src/users/user.entity/user.entity';
import { WeeklyRequestCount } from 'src/users/user.entity/weekly.entity';
import { MonthlyRequestCount } from 'src/users/user.entity/monthly.entity';
import dayjs from 'dayjs';

@Injectable()
export class ShortUrlsService {
  constructor(
    @InjectRepository(ShortUrl)
    private readonly shortUrlRepo: Repository<ShortUrl>,

    @InjectRepository(WeeklyRequestCount)
    private readonly weeklyRepo: Repository<WeeklyRequestCount>,

    @InjectRepository(MonthlyRequestCount)
    private readonly monthlyRepo: Repository<MonthlyRequestCount>,
  ) {}

  async getAllShortUrls(): Promise<ShortUrl[]> {
    return this.shortUrlRepo.find({ relations: ['user'] });
  }

  async createShortUrl(dto: CreateShortUrlDto, user: User): Promise<ShortUrl> {
    const { originalUrl, shortenedUrl } = dto;

    const shortUrl = this.shortUrlRepo.create({
      originalUrl,
      shortenedUrl,
      user,
    });

    try {
      return await this.shortUrlRepo.save(shortUrl);
    } catch (err) {
      if (err.code === '23505') {
        throw new ConflictException('Shortened URL already exists');
      }
      throw new InternalServerErrorException('Failed to create short URL');
    }
  }

  async getShortUrlById(suid: number): Promise<ShortUrl> {
    const shortUrl = await this.shortUrlRepo.findOne({
      where: { suid },
      relations: ['user'],
    });
    if (!shortUrl) {
      throw new NotFoundException(`Short URL with ID ${suid} not found`);
    }
    return shortUrl;
  }

  async getByShortenedUrl(shortenedUrl: string): Promise<ShortUrl | null> {
    return this.shortUrlRepo.findOne({ where: { shortenedUrl } });
  }

  async updateAnalytics(shortUrl: ShortUrl): Promise<void> {
    const today = dayjs();
    const weekStart = today.startOf('week').toDate();
    const monthStart = today.startOf('month').toDate();

    let weekly = await this.weeklyRepo.findOne({
      where: { shortUrl: { suid: shortUrl.suid }, week_start_date: weekStart },
      relations: ['shortUrl'],
    });

    if (!weekly) {
      weekly = this.weeklyRepo.create({
        shortUrl,
        week_start_date: weekStart,
        request_count: 1,
      });
    } else {
      weekly.request_count += 1;
    }
    await this.weeklyRepo.save(weekly);

    let monthly = await this.monthlyRepo.findOne({
      where: {
        shortUrl: { suid: shortUrl.suid },
        month_start_date: monthStart,
      },
      relations: ['shortUrl'],
    });

    if (!monthly) {
      monthly = this.monthlyRepo.create({
        shortUrl,
        month_start_date: monthStart,
        request_count: 1,
      });
    } else {
      monthly.request_count += 1;
    }
    await this.monthlyRepo.save(monthly);
  }

  async deleteShortUrl(suid: number): Promise<void> {
    const result = await this.shortUrlRepo.delete({ suid });
    if (result.affected === 0) {
      throw new NotFoundException(`Short URL with ID ${suid} not found`);
    }
  }

  async updateShortUrl(
    suid: number,
    dto: UpdateShortUrlDto,
  ): Promise<ShortUrl> {
    const shortUrl = await this.getShortUrlById(suid);

    shortUrl.originalUrl = dto.originalUrl;
    shortUrl.shortenedUrl = dto.shortenedUrl;

    return await this.shortUrlRepo.save(shortUrl);
  }
}
