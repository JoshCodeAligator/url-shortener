import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { JwtService } from '@nestjs/jwt';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user or admin' })
  @ApiBody({
    schema: {
      example: {
        email: 'user@example.com',
        password: 'strongPassword123',
        isAdmin: false,
      },
    },
  })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async register(
    @Body() body: { email: string; password: string; isAdmin?: boolean },
  ) {
    const hashedPassword = await bcrypt.hash(body.password, 10);
    const user = this.userRepo.create({
      email: body.email,
      password: hashedPassword,
      isAdmin: body.isAdmin === true,
    });
    await this.userRepo.save(user);
    return { message: 'User registered' };
  }

  @Post('login')
  @ApiOperation({ summary: 'Login and get JWT token' })
  @ApiBody({
    schema: {
      example: {
        email: 'user@example.com',
        password: 'strongPassword123',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful, returns JWT token',
    schema: {
      example: { access_token: 'jwt.token.here' },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.userRepo.findOne({ where: { email: body.email } });
    if (!user || !(await bcrypt.compare(body.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const token = this.jwtService.sign({ userId: user.uid, isAdmin: user.isAdmin });
    return { access_token: token };
  }
}
