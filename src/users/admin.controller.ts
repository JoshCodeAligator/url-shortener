// src/users/admin-analytics.controller.ts
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
  
  @Injectable()
  class AdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest();
      const user = request.user;
      return user?.isAdmin === true;
    }
  }
  
  @Controller('admin/analytics')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  export class AdminAnalyticsController {
    constructor(
      @InjectRepository(Analytics)
      private readonly analyticsRepo: Repository<Analytics>,
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
  }
  