import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Res,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Req,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Response, Request } from 'express';
import dayjs from 'dayjs';

import { ShortUrl } from './short-url.entity';
import { WeeklyRequestCount } from 'src/users/user.entity/weekly.entity';
import { MonthlyRequestCount } from 'src/users/user.entity/monthly.entity';
import { CreateShortUrlDto } from './dto/create-short-url.dto';
import { User } from 'src/users/user.entity/user.entity';
import { Analytics } from 'src/users/user.entity/analytics.entity';

declare module 'express' {
  interface Request {
    user?: any;
  }
}

@Controller('short-urls')
export class ShortUrlController {
  constructor(
    @InjectRepository(Analytics)
    private readonly analyticsRepo: Repository<Analytics>,

    @InjectRepository(ShortUrl)
    private readonly shortUrlRepo: Repository<ShortUrl>,

    @InjectRepository(WeeklyRequestCount)
    private readonly weeklyRepo: Repository<WeeklyRequestCount>,

    @InjectRepository(MonthlyRequestCount)
    private readonly monthlyRepo: Repository<MonthlyRequestCount>,
  ) {}

  @Post()
async createShortUrl(@Body() dto: CreateShortUrlDto, @Req() req: Request) {
  const user = req.user;

  const shortUrl = this.shortUrlRepo.create({
    originalUrl: dto.originalUrl,
    shortenedUrl: dto.shortenedUrl,
    user,
  });

  try {
    await this.shortUrlRepo.save(shortUrl);

    const analytics = this.analyticsRepo.create({
      shortUrl: shortUrl,
      totalRequests: 0,
      deviceTypeDistribution: {} as Record<string, number>,
      osTypeDistribution: {} as Record<string, number>,
      geographicalDistribution: {} as Record<string, number>,
      hourlyRequestDistribution: {} as Record<string, number>,
      referrerDomains: {} as Record<string, number>,
    });
    await this.analyticsRepo.save(analytics);
    

  } catch (err) {
    if (err.code === '23505') {
      throw new ConflictException('Shortened URL already exists');
    } else {
      throw new InternalServerErrorException('Failed to create Short URL');
    }
  }

  return shortUrl;
}

  @Get()
  async getAllShortUrls(@Req() req: Request) {
    const fallbackUser: User = { uid: 1 } as User;
    const user = (req.user as User) || fallbackUser;

    return this.shortUrlRepo.find({ where: { user: { uid: user.uid } } });
  }

  @Get('/:shortenedUrl')
  async redirect(@Param('shortenedUrl') short: string, @Res() res: Response) {
    const shortUrl = await this.shortUrlRepo.findOne({
      where: { shortenedUrl: short },
    });

    if (!shortUrl) {
      throw new NotFoundException('Short URL not found');
    }

    const today = dayjs();
    const weekStartDate = today.startOf('week').toDate();
    const monthStartDate = today.startOf('month').toDate();

    let weekly = await this.weeklyRepo.findOne({
      where: {
        shortUrl: { suid: shortUrl.suid },
        week_start_date: weekStartDate,
      },
      relations: ['shortUrl'],
    });

    if (!weekly) {
      weekly = this.weeklyRepo.create({
        shortUrl,
        week_start_date: weekStartDate,
        request_count: 1,
      });
    } else {
      weekly.request_count += 1;
    }
    await this.weeklyRepo.save(weekly);

    let monthly = await this.monthlyRepo.findOne({
      where: {
        shortUrl: { suid: shortUrl.suid },
        month_start_date: monthStartDate,
      },
      relations: ['shortUrl'],
    });

    if (!monthly) {
      monthly = this.monthlyRepo.create({
        shortUrl,
        month_start_date: monthStartDate,
        request_count: 1,
      });
    } else {
      monthly.request_count += 1;
    }
    await this.monthlyRepo.save(monthly);

    return res.redirect(shortUrl.originalUrl);
  }
}
