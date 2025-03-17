import { IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShortUrlDto {
  @ApiProperty({
    example: 'https://youtube.com',
    description: 'The original URL to be shortened',
  })
  @IsNotEmpty()
  @IsUrl()
  originalUrl: string;

  @ApiProperty({
    example: 'yt',
    description: 'Shortened name for the URL',
  })
  @IsNotEmpty()
  @IsString()
  shortenedUrl: string;
}
