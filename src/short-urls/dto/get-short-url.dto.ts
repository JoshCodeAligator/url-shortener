import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetShortUrlDto {
  @ApiProperty({
    example: 1,
    description: 'Unique ID (suid) of the shortened URL',
  })
  @IsNumber()
  suid: number;
}
