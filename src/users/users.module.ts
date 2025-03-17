import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity/user.entity';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ShortUrl } from 'src/short-urls/short-url.entity';
import { Analytics } from './user.entity/analytics.entity';
import { WeeklyRequestCount } from './user.entity/weekly.entity';
import { MonthlyRequestCount } from './user.entity/monthly.entity';

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
