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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';

@Injectable()
class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    return request.user?.isAdmin === true;
  }
}

@ApiTags('Admin Analytics')
@ApiBearerAuth()
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
  @ApiOperation({ summary: 'Get full analytics for a Short URL' })
  @ApiParam({ name: 'shortUrlId', type: Number, description: 'Short URL ID (suid)' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Short URL or analytics not found' })
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
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getAllUsers() {
    return this.userRepo.find();
  }

  @Get('urls')
  @ApiOperation({ summary: 'Get all shortened URLs (Admin only)' })
  @ApiResponse({ status: 200, description: 'Short URLs retrieved successfully' })
  async getAllShortUrls() {
    return this.shortUrlRepo.find({ relations: ['user'] });
  }
}
