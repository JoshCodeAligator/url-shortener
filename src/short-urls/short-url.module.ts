import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShortUrl } from './short-url.entity';
import { WeeklyRequestCount } from 'src/users/user.entity/weekly.entity';
import { MonthlyRequestCount } from 'src/users/user.entity/monthly.entity';
import { ShortUrlsService } from './short-url.service';
import { ShortUrlController } from './short-url.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShortUrl, WeeklyRequestCount, MonthlyRequestCount]),
  ],
  providers: [ShortUrlsService],
  controllers: [ShortUrlController],
  exports: [ShortUrlsService],
})
export class ShortUrlsModule {}
