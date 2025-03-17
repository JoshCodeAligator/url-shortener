import { Module } from '@nestjs/common';
import { ShortUrlsModule } from '../short-urls/short-url.module';
import { WildcardController } from './wildcard.controller';

@Module({
  imports: [ShortUrlsModule],
  controllers: [WildcardController],
})
export class WildcardModule {}
