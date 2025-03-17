import {
    Controller,
    Get,
    Param,
    UseGuards,
    ExecutionContext,
    Injectable,
    CanActivate,
  } from '@nestjs/common';
  import { AuthGuard } from '@nestjs/passport';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import { Analytics } from './user.entity/analytics.entity';
  import { WeeklyRequestCount } from './user.entity/weekly.entity';
  import { MonthlyRequestCount } from './user.entity/monthly.entity';
  
  @Injectable()
  class AdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest();
      const user = request.user;
      return user?.isAdmin === true;
    }
  }
  
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Controller('admin/analytics')
  export class AdminAnalyticsController {
    constructor(
      @InjectRepository(Analytics)
      private readonly analyticsRepo: Repository<Analytics>,
  
      @InjectRepository(WeeklyRequestCount)
      private readonly weeklyRepo: Repository<WeeklyRequestCount>,
  
      @InjectRepository(MonthlyRequestCount)
      private readonly monthlyRepo: Repository<MonthlyRequestCount>,
    ) {}
  
    @Get(':shortUrlId')
    async getAnalytics(@Param('shortUrlId') id: number) {
      const analytics = await this.analyticsRepo.findOne({
        where: { shortUrl: { suid: id } },
        relations: ['shortUrl'],
      });
  
      if (!analytics) {
        return { message: 'No analytics found for this URL' };
      }
  
      return analytics;
    }
  
    @Get('weekly/:shortUrlId')
    async getWeeklyCounts(@Param('shortUrlId') id: number) {
      const weeklyCounts = await this.weeklyRepo.find({
        where: { shortUrl: { suid: id } },
        relations: ['shortUrl'],
        order: { week_start_date: 'ASC' },
      });
  
      if (!weeklyCounts.length) {
        return { message: 'No weekly data found for this URL' };
      }
  
      return weeklyCounts;
    }
  
    @Get('monthly/:shortUrlId')
    async getMonthlyCounts(@Param('shortUrlId') id: number) {
      const monthlyCounts = await this.monthlyRepo.find({
        where: { shortUrl: { suid: id } },
        relations: ['shortUrl'],
        order: { month_start_date: 'ASC' },
      });
  
      if (!monthlyCounts.length) {
        return { message: 'No monthly data found for this URL' };
      }
  
      return monthlyCounts;
    }
  }
  