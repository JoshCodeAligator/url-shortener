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
import { WeeklyRequestCount } from 'src/entities/weekly.entity';
import { MonthlyRequestCount } from 'src/entities/monthly.entity';
import { CreateShortUrlDto } from './dto/create-short-url.dto';
import { User } from 'src/users/user.entity';
import { Analytics } from 'src/entities/analytics.entity';

import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

declare module 'express' {
  interface Request {
    user?: any;
  }
}

@ApiTags('Short URLs')
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new shortened URL' })
  @ApiResponse({ status: 201, description: 'Short URL created successfully.' })
  @ApiResponse({ status: 409, description: 'Shortened URL already exists.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
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
        deviceTypeDistribution: {},
        osTypeDistribution: {},
        geographicalDistribution: {},
        hourlyRequestDistribution: {},
        referrerDomains: {},
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all short URLs for the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of short URLs returned successfully.' })
  async getAllShortUrls(@Req() req: Request) {
    const fallbackUser: User = { uid: 1 } as User;
    const user = req.user || fallbackUser;
    return this.shortUrlRepo.find({ where: { user: { uid: user.uid } } });
  }

  @Get('/:shortenedUrl')
  @ApiOperation({ summary: 'Redirect to the original URL based on the shortened URL' })
  @ApiParam({ name: 'shortenedUrl', type: String, description: 'Shortened URL code' })
  @ApiResponse({ status: 301, description: 'Redirecting to original URL.' })
  @ApiResponse({ status: 404, description: 'Short URL not found.' })
  async redirect(@Param('shortenedUrl') short: string, @Req() req: Request, @Res() res: Response) {
    const shortUrl = await this.shortUrlRepo.findOne({
      where: { shortenedUrl: short },
      relations: ['analytics'],
    });

    if (!shortUrl) {
      throw new NotFoundException('Short URL not found');
    }

    const userAgent = req.headers['user-agent'] || '';
    const referrer = req.headers.referer || 'direct';
    const ip = req.ip || 'unknown';
    const hour = dayjs().hour().toString(); 

    let device = 'Other';
    let os = 'Other';

    if (/mobile/i.test(userAgent)) device = 'Mobile';
    else if (/tablet/i.test(userAgent)) device = 'Tablet';
    else device = 'Desktop';

    if (/windows/i.test(userAgent)) os = 'Windows';
    else if (/mac/i.test(userAgent)) os = 'MacOS';
    else if (/linux/i.test(userAgent)) os = 'Linux';
    else if (/android/i.test(userAgent)) os = 'Android';
    else if (/iphone|ipad/i.test(userAgent)) os = 'iOS';

    const analytics = shortUrl.analytics;

    analytics.totalRequests += 1;
    analytics.deviceTypeDistribution[device] = (analytics.deviceTypeDistribution[device] || 0) + 1;
    analytics.osTypeDistribution[os] = (analytics.osTypeDistribution[os] || 0) + 1;
    analytics.geographicalDistribution[ip] = (analytics.geographicalDistribution[ip] || 0) + 1;
    analytics.referrerDomains[referrer] = (analytics.referrerDomains[referrer] || 0) + 1;
    analytics.hourlyRequestDistribution[hour] = (analytics.hourlyRequestDistribution[hour] || 0) + 1;

    await this.analyticsRepo.save(analytics);

    const today = dayjs();
    const weekStart = today.startOf('week').toDate();
    const monthStart = today.startOf('month').toDate();

    let weekly = await this.weeklyRepo.findOne({
      where: {
        shortUrl: { suid: shortUrl.suid },
        week_start_date: weekStart,
      },
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

    return res.redirect(shortUrl.originalUrl);
  }
}
