import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { ShortUrlsService } from 'src/short-urls/short-url.service';

@Controller()
export class WildcardController {
  constructor(private readonly shortUrlsService: ShortUrlsService) {}

  @Get('/:shortenedUrl')
  async handleRedirect(
    @Param('shortenedUrl') shortenedUrl: string,
    @Res() res: Response,
  ): Promise<any> {
    const shortUrl = await this.shortUrlsService.getByShortenedUrl(shortenedUrl);
    if (!shortUrl) {
      return res.status(404).send('Short URL not found');
    }

    await this.shortUrlsService.updateAnalytics(shortUrl);

    return res.redirect(301, shortUrl.originalUrl);
  }
}
