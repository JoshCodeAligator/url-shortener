import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShortUrl } from './short-url.entity';
import { ShortUrlsService } from './short-url.service';
import { ShortUrlController } from './short-url.controller';
import { WeeklyRequestCount } from 'src/entities/weekly.entity';
import { MonthlyRequestCount } from 'src/entities/monthly.entity';
import { Analytics } from 'src/entities/analytics.entity';



@Module({
  imports: [
    TypeOrmModule.forFeature([ShortUrl, WeeklyRequestCount, MonthlyRequestCount, Analytics]),
  ],
  providers: [ShortUrlsService],
  controllers: [ShortUrlController],
  exports: [ShortUrlsService],
})
export class ShortUrlsModule {}
