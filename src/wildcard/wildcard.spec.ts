import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Connection, Repository } from 'typeorm';
import { faker } from '@faker-js/faker';

import { clearRepositories, createNestApplication } from '../test-helpers';
import { Link } from '../links/link.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('Wildcard', () => {
  let app: INestApplication;
  let dbConnection: Connection;
  let linkRepository: Repository<Link>;

  const createLinkItem = async () => {
    const link = linkRepository.create({
      name: faker.word.noun(),
      url: faker.internet.url(),
    });
    return linkRepository.save(link);
  };

  beforeAll(async () => {
    app = await createNestApplication({
      onBeforeInit: (moduleRef) => {
        dbConnection = moduleRef.get(Connection);
        linkRepository = moduleRef.get<Repository<Link>>(getRepositoryToken(Link));
      },
    });
  });

  beforeEach(async () => {
    await clearRepositories(dbConnection);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/:name (GET)', () => {
    it('should handle not found', async () => {
      const shortName = faker.word.noun();
      const res = await request(app.getHttpServer()).get(`/${shortName}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Not Found');
    });

    it('should handle redirect', async () => {
      const link = await createLinkItem();
      const res = await request(app.getHttpServer()).get(`/${link.name}`);

      expect(res.status).toBe(301);
      expect(res.headers.location).toBe(link.url);
    });
  });
});
