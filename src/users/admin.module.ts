import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Analytics } from '../entities/analytics.entity';
import { WeeklyRequestCount } from '../entities/weekly.entity';
import { MonthlyRequestCount } from '../entities/monthly.entity';
import { User } from '../users/user.entity';
import { ShortUrl } from '../short-urls/short-url.entity';
import { AdminAnalyticsController } from 'src/controllers/admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Analytics,
      WeeklyRequestCount,
      MonthlyRequestCount,
      User,
      ShortUrl,
    ]),
  ],
  controllers: [AdminAnalyticsController],
  providers: [],
})
export class AdminModule {}
