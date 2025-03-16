import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity/user.entity';
import { JwtService } from '@nestjs/jwt';


@Controller('auth')
export class AuthController {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  async register(@Body() body: { email: string; password: string }) {
    const hashedPassword = await bcrypt.hash(body.password, 10);
    const user = this.userRepo.create({ email: body.email, password: hashedPassword });
    await this.userRepo.save(user);
    return { message: 'User registered' };
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.userRepo.findOne({ where: { email: body.email } });
    if (!user || !(await bcrypt.compare(body.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const token = this.jwtService.sign({ userId: user.uid });
    return { access_token: token };
  }
}
