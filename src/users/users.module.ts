import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity/user.entity';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ShortUrl } from './user.entity/short-url.entity';
import { Analytics } from './user.entity/analytics.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, ShortUrl, Analytics]), JwtModule.register({ secret: process.env.JWT_SECRET })], 
  controllers: [AuthController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
