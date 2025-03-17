import { IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateShortUrlDto {
  @ApiProperty({
    example: 'https://youtube.com',
    description: 'The updated original URL',
  })
  @IsNotEmpty()
  @IsUrl()
  originalUrl: string;

  @ApiProperty({
    example: 'yt',
    description: 'The updated shortened URL',
  })
  @IsNotEmpty()
  @IsString()
  shortenedUrl: string;
}
