import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { AuthController } from '../controllers/auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ShortUrl } from 'src/short-urls/short-url.entity';
import { Analytics } from '../entities/analytics.entity';
import { WeeklyRequestCount } from '../entities/weekly.entity';
import { MonthlyRequestCount } from '../entities/monthly.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      ShortUrl,
      Analytics,
      WeeklyRequestCount,
      MonthlyRequestCount,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  controllers: [AuthController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
