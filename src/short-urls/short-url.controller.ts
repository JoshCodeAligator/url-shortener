import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Response } from 'express';
import dayjs from 'dayjs';

import { ShortUrl } from './short-url.entity';
import { WeeklyRequestCount } from 'src/users/user.entity/weekly.entity';
import { MonthlyRequestCount } from 'src/users/user.entity/monthly.entity';

@Controller()
export class ShortUrlController {
  constructor(
    @InjectRepository(ShortUrl)
    private readonly shortUrlRepo: Repository<ShortUrl>,

    @InjectRepository(WeeklyRequestCount)
    private readonly weeklyRepo: Repository<WeeklyRequestCount>,

    @InjectRepository(MonthlyRequestCount)
    private readonly monthlyRepo: Repository<MonthlyRequestCount>,
  ) {}

  @Get(':shortenedUrl')
  async redirect(@Param('shortenedUrl') short: string, @Res() res: Response) {
    const shortUrl = await this.shortUrlRepo.findOne({
      where: { shortenedUrl: short },
    });

    if (!shortUrl) {
      throw new NotFoundException('Short URL not found');
    }

    const today = dayjs();
    const weekStartDate = today.startOf('week').format('YYYY-MM-DD');
    const monthStartDate = today.startOf('month').format('YYYY-MM-DD');

    // --- Weekly Count ---
    let weekly = await this.weeklyRepo.findOne({
      where: {
        shortUrl: { suid: shortUrl.suid },
        week_start_date: new Date(weekStartDate),
      },
      relations: ['shortUrl'],
    });

    if (!weekly) {
      weekly = this.weeklyRepo.create({
        shortUrl,
        week_start_date: new Date(weekStartDate),
        request_count: 1,
      });
    } else {
      weekly.request_count += 1;
    }
    await this.weeklyRepo.save(weekly);

    // --- Monthly Count ---
    let monthly = await this.monthlyRepo.findOne({
      where: {
        shortUrl: { suid: shortUrl.suid },
        month_start_date: new Date(monthStartDate),
      },
      relations: ['shortUrl'],
    });

    if (!monthly) {
      monthly = this.monthlyRepo.create({
        shortUrl,
        month_start_date: new Date(monthStartDate),
        request_count: 1,
      });
    } else {
      monthly.request_count += 1;
    }
    await this.monthlyRepo.save(monthly);

    return res.redirect(shortUrl.originalUrl);
  }
}
