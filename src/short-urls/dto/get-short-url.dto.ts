import { IsNumber } from 'class-validator';

export class GetShortUrlDto {
  @IsNumber()
  suid: number;
}
