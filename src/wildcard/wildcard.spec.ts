import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { faker } from '@faker-js/faker';

import { clearRepositories, createNestApplication } from '../test-helpers';
import { ShortUrl } from '../short-urls/short-url.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('Wildcard', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let shortUrlRepo: Repository<ShortUrl>;

  const createShortUrlItem = async (): Promise<ShortUrl> => {
    const shortUrl = shortUrlRepo.create({
      shortenedUrl: faker.word.noun(),
      originalUrl: faker.internet.url(),
    });
    return shortUrlRepo.save(shortUrl);
  };

  beforeAll(async () => {
    app = await createNestApplication({
      onBeforeInit: (moduleRef) => {
        dataSource = moduleRef.get(DataSource);
        shortUrlRepo = moduleRef.get<Repository<ShortUrl>>(
          getRepositoryToken(ShortUrl),
        );
      },
    });
  });

  beforeEach(async () => {
    await clearRepositories(dataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/:shortenedUrl (GET)', () => {
    it('should handle not found', async () => {
      const shortenedUrl = faker.word.noun();
      const res = await request(app.getHttpServer()).get(`/${shortenedUrl}`);

      expect(res.status).toBe(404);
      expect(res.text).toBe('Short URL not found');
    });

    it('should handle redirect', async () => {
      const shortUrl = await createShortUrlItem();
      const res = await request(app.getHttpServer()).get(`/${shortUrl.shortenedUrl}`);

      expect(res.status).toBe(301);
      expect(res.headers.location).toBe(shortUrl.originalUrl);
    });
  });
});
