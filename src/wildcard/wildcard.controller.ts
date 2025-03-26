import { Controller, Get, Param, Res, Req} from '@nestjs/common';
import { Request, Response } from 'express';
import { ShortUrlsService } from 'src/short-urls/short-url.service';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@ApiTags('URL Redirection')
@Controller()
export class WildcardController {
  constructor(private readonly shortUrlsService: ShortUrlsService) {}

  @Get('/:shortenedUrl')
  @ApiOperation({ summary: 'Redirect to the original URL' })
  @ApiParam({
    name: 'shortenedUrl',
    type: 'string',
    example: 'abc123',
    description: 'Shortened URL code to redirect',
  })
  @ApiResponse({ status: 301, description: 'Redirected to original URL' })
  @ApiResponse({ status: 404, description: 'Short URL not found' })
  async handleRedirect(
    @Param('shortenedUrl') shortenedUrl: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<any> {
    const shortUrl = await this.shortUrlsService.getByShortenedUrl(shortenedUrl);
    if (!shortUrl) {
      return res.status(404).send('Short URL not found');
    }

    await this.shortUrlsService.updateAnalytics(shortUrl, req);

    return res.redirect(301, shortUrl.originalUrl);
  }
}
