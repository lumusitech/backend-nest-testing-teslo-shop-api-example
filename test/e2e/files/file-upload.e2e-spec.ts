import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';

describe('Files upload (e2e)', () => {
  let app: INestApplication;

  const testImagePath = join(__dirname, 'test-image.jpg');

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  afterAll(() => {
    app.close();
  });

  it('/files/product (POST) - should throw 400 without file', async () => {
    const response = await request(app.getHttpServer()).post('/files/product');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Make sure that the file is an image',
      error: 'Bad Request',
      statusCode: 400,
    });
  });

  it('/files/product (POST) - should throw 400 if file is not an image', async () => {
    const response = await request(app.getHttpServer())
      .post('/files/product')
      .attach('file', Buffer.from('This is a test fake file'), 'text.txt');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Make sure that the file is an image',
      error: 'Bad Request',
      statusCode: 400,
    });
  });

  it('/files/product (POST) - should upload a valid image', async () => {
    const response = await request(app.getHttpServer())
      .post('/files/product')
      .attach('file', testImagePath);

    const fileName = response.body.fileName;

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('secureUrl');
    expect(response.body).toHaveProperty('fileName');
    expect(response.body).toEqual({
      secureUrl: expect.stringContaining(
        'http://localhost:3000/api/files/product/',
      ),
      fileName: expect.stringContaining('.jpeg'),
    });

    const filePathToRemove = join(
      __dirname,
      '../../../static/products',
      fileName,
    );
    const fileExists = existsSync(filePathToRemove);
    expect(fileExists).toBeTruthy();

    //? Remove the test image file
    unlinkSync(filePathToRemove);
  });

  it('/files/product (GET) - should throw 400 if image does not exist', async () => {
    const invalidId = 'non-product-image.jpeg';
    const response = await request(app.getHttpServer()).get(
      `/files/product/${invalidId}`,
    );

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: `No product found with image ${invalidId}`,
      error: 'Bad Request',
      statusCode: 400,
    });
  });
});
