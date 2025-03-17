import {
  Controller,
  Get,
  Param,
  UseGuards,
  ExecutionContext,
  Injectable,
  CanActivate,
  NotFoundException,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Analytics } from '../entities/analytics.entity';
import { WeeklyRequestCount } from '../entities/weekly.entity';
import { MonthlyRequestCount } from '../entities/monthly.entity';
import { User } from '../users/user.entity';
import { ShortUrl } from 'src/short-urls/short-url.entity';

@Injectable()
class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    return request.user?.isAdmin === true;
  }
}

@UseGuards(AuthGuard('jwt'), AdminGuard)
@Controller('admin')
export class AdminAnalyticsController {
  constructor(
    @InjectRepository(Analytics)
    private readonly analyticsRepo: Repository<Analytics>,
    @InjectRepository(WeeklyRequestCount)
    private readonly weeklyRepo: Repository<WeeklyRequestCount>,
    @InjectRepository(MonthlyRequestCount)
    private readonly monthlyRepo: Repository<MonthlyRequestCount>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ShortUrl)
    private readonly shortUrlRepo: Repository<ShortUrl>,
  ) {}

  @Get('analytics/:shortUrlId')
  async getAnalytics(@Param('shortUrlId', ParseIntPipe) id: number) {
    const shortUrl = await this.shortUrlRepo.findOne({
      where: { suid: id },
      relations: ['user'],
    });

    if (!shortUrl) {
      throw new NotFoundException('Short URL not found');
    }

    const analytics = await this.analyticsRepo.findOne({
      where: { shortUrl: { suid: id } },
      relations: ['shortUrl'],
    });

    const weeklyCounts = await this.weeklyRepo.find({
      where: { shortUrl: { suid: id } },
      order: { week_start_date: 'ASC' },
    });

    const monthlyCounts = await this.monthlyRepo.find({
      where: { shortUrl: { suid: id } },
      order: { month_start_date: 'ASC' },
    });

    if (!analytics) {
      throw new NotFoundException('Analytics data not found for this URL');
    }

    return {
      shortUrl,
      analytics,
      weeklyCounts,
      monthlyCounts,
    };
  }

  @Get('users')
  async getAllUsers() {
    return this.userRepo.find();
  }

  @Get('urls')
  async getAllShortUrls() {
    return this.shortUrlRepo.find({ relations: ['user'] });
  }
}
