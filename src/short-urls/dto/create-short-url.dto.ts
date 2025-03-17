import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class CreateShortUrlDto {
  @IsNotEmpty()
  @IsUrl()
  originalUrl: string;

  @IsNotEmpty()
  @IsString()
  shortenedUrl: string;
}
