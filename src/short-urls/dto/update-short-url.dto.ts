import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class UpdateShortUrlDto {
  @IsNotEmpty()
  @IsUrl()
  originalUrl: string;

  @IsNotEmpty()
  @IsString()
  shortenedUrl: string;
}
