import {
  UseGuards,
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
import { AuthGuard } from '@nestjs/passport';

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

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

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
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new shortened URL' })
  @ApiResponse({ status: 201, description: 'Short URL created successfully.' })
  @ApiResponse({ status: 409, description: 'Shortened URL already exists.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async createShortUrl(@Body() dto: CreateShortUrlDto, @Req() req: Request) {
    const user = await this.userRepo.findOne({ where: { uid: req.user.uid } });

    if (!user) {
      throw new NotFoundException('User not found');
    }
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
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all short URLs for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'List of short URLs returned successfully.',
  })
  async getAllShortUrls(@Req() req: Request) {
    return this.shortUrlRepo.find({
      where: { user: { uid: req.user.uid } },
    });
  }
}
