import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Connection } from 'typeorm';

export async function createNestApplication({
  onBeforeInit,
}: {
  onBeforeInit: (moduleRef: TestingModule) => void;
}) {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();

  app.useGlobalPipes(new ValidationPipe());

  onBeforeInit(moduleRef);

  await app.init();

  return app;
}

export async function clearRepositories(dbConnection: Connection) {
    const entities = dbConnection.entityMetadatas;
    const promises: Array<Promise<void>> = [];
  
    for (const entity of entities) {
      const repository = dbConnection.getRepository(entity.name);
      promises.push(repository.clear());
    }
  
    await Promise.all(promises);
  }