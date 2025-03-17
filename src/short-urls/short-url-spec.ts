import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { clearRepositories, createNestApplication } from '../test-helpers';
import { ShortUrlsRepository } from './short-urls.repository';
import { faker } from '@faker-js/faker';
import request from 'supertest';
import { User } from 'src/users/user.entity';

describe('ShortUrls', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let shortUrlsRepo: ShortUrlsRepository;

  const createInvalidShortUrlIds = () => {
    return [faker.word.noun(), faker.string.uuid()];
  };

  const createShortUrlBody = () => {
    return {
      originalUrl: faker.internet.url(),
      shortenedUrl: faker.word.noun(),
    };
  };

  const createInvalidShortUrlBodies = () => {
    const validData = createShortUrlBody();

    return [
      undefined,
      {},
      { originalUrl: undefined, shortenedUrl: validData.shortenedUrl },
      { originalUrl: null, shortenedUrl: validData.shortenedUrl },
      { originalUrl: '', shortenedUrl: validData.shortenedUrl },
      { originalUrl: faker.word.noun(), shortenedUrl: validData.shortenedUrl },

      { originalUrl: validData.originalUrl, shortenedUrl: undefined },
      { originalUrl: validData.originalUrl, shortenedUrl: null },
      { originalUrl: validData.originalUrl, shortenedUrl: '' },
    ];
  };

  const mockUser: User = {
    uid: 1,
    email: 'test@example.com',
    password: 'hashedPassword',
    isAdmin: false,
    shortUrls: [],
  };

  const createShortUrlItem = async () => {
    const dto = createShortUrlBody();
    return shortUrlsRepo.createShortUrl(dto, mockUser); 
  };

  beforeAll(async () => {
    app = await createNestApplication({
      onBeforeInit: (moduleRef) => {
        dataSource = moduleRef.get(DataSource);
        shortUrlsRepo = moduleRef.get(ShortUrlsRepository);
      },
    });
  });

  beforeEach(async () => {
    await clearRepositories(dataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/links (GET)', () => {
    it('should return empty array if no data', async () => {
      const res = await request(app.getHttpServer()).get('/links');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should return all short URLs', async () => {
      const count = 3;
      const items = await Promise.all(
        Array.from({ length: count }, () => createShortUrlItem())
      );

      const res = await request(app.getHttpServer()).get('/links');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(count);
      items.forEach(item => {
        expect(res.body).toEqual(expect.arrayContaining([
          expect.objectContaining({ suid: item.suid })
        ]));
      });
    });
  });

  describe('/links (POST)', () => {
    it('should reject invalid data', async () => {
      const invalidBodies = createInvalidShortUrlBodies();

      for (const body of invalidBodies) {
        const res = await request(app.getHttpServer()).post('/links').send(body);
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Bad Request');
      }
    });

    it('should create short URL', async () => {
      const dto = createShortUrlBody();

      const res = await request(app.getHttpServer()).post('/links').send(dto);
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        originalUrl: dto.originalUrl,
        shortenedUrl: dto.shortenedUrl,
      });
      expect(res.body.suid).toBeDefined();

      const stored = await shortUrlsRepo.findOneBy({ suid: res.body.suid });
      expect(stored).toMatchObject(dto);
    });

    it('should handle duplicate short name', async () => {
      const existing = await createShortUrlItem();
      const dto = createShortUrlBody();

      const res = await request(app.getHttpServer()).post('/links').send({
        originalUrl: dto.originalUrl,
        shortenedUrl: existing.shortenedUrl,
      });

      expect(res.status).toBe(409);
      expect(res.body.message).toBe('Shortened URL already exists');
    });

    it('should handle server error', async () => {
      const mock = jest
        .spyOn(shortUrlsRepo, 'save')
        .mockRejectedValueOnce(new Error());

      const dto = createShortUrlBody();
      const res = await request(app.getHttpServer()).post('/links').send(dto);

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Internal Server Error');

      mock.mockRestore();
    });
  });

  describe('/links/:id (DELETE)', () => {
    it('should reject invalid id', async () => {
      const invalidIds = createInvalidShortUrlIds();

      for (const id of invalidIds) {
        const res = await request(app.getHttpServer()).delete(`/links/${id}`);
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Bad Request');
      }
    });

    it('should return 404 if not found', async () => {
      const res = await request(app.getHttpServer()).delete(`/links/9999`);
      expect(res.status).toBe(404);
    });

    it('should delete existing short URL', async () => {
      const item = await createShortUrlItem();
      const res = await request(app.getHttpServer()).delete(`/links/${item.suid}`);
      expect(res.status).toBe(200);

      const check = await shortUrlsRepo.findOneBy({ suid: item.suid });
      expect(check).toBeNull();
    });
  });

  describe('/links/:id (PUT)', () => {
    it('should reject invalid id', async () => {
      const invalidIds = createInvalidShortUrlIds();

      for (const id of invalidIds) {
        const res = await request(app.getHttpServer()).put(`/links/${id}`);
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Bad Request');
      }
    });

    it('should reject invalid body', async () => {
      const item = await createShortUrlItem();
      const invalidBodies = createInvalidShortUrlBodies();

      for (const body of invalidBodies) {
        const res = await request(app.getHttpServer())
          .put(`/links/${item.suid}`)
          .send(body);
        expect(res.status).toBe(400);
      }
    });

    it('should update short URL', async () => {
      const item = await createShortUrlItem();
      const newBody = createShortUrlBody();

      const res = await request(app.getHttpServer())
        .put(`/links/${item.suid}`)
        .send(newBody);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ ...newBody, suid: item.suid });

      const updated = await shortUrlsRepo.findOneBy({ suid: item.suid });
      expect(updated).toMatchObject(newBody);
    });
  });
});
