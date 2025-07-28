import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LoginUserDto } from 'src/auth/dto';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../../../src/app.module';
import { User } from '../../../src/auth/entities/user.entity';

const testingUser = {
  email: 'test@email.com',
  password: 'm1p4s$w0Rd',
  fullName: 'Test User',
};
const testingAdminUser = {
  email: 'test.admin@email.com',
  password: 'm1p4s$w0Rd',
  fullName: 'Test Admin',
};

describe('Auth login (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

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

    userRepository = app.get<Repository<User>>(getRepositoryToken(User));
    await userRepository.delete({ email: testingUser.email });
    await userRepository.delete({ email: testingAdminUser.email });

    const responseUser = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testingUser);
    const responseAdmin = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testingAdminUser);

    await userRepository.update(
      { email: testingAdminUser.email },
      { roles: ['admin'] },
    );

    console.log({
      userCreationStatus: responseUser.status,
      adminCreationStatus: responseAdmin.status,
    });
  });

  afterAll(() => {
    app.close();
  });

  it('/auth/login (POST) - should throw 400 without body', async () => {
    const response = await request(app.getHttpServer()).post('/auth/login');

    const errorMessages = [
      'email must be an email',
      'email must be a string',
      'The password must have a Uppercase, lowercase letter and a number',
      'password must be shorter than or equal to 50 characters',
      'password must be longer than or equal to 6 characters',
      'password must be a string',
    ];

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: errorMessages,
      error: 'Bad Request',
      statusCode: 400,
    });

    errorMessages.forEach((msg) => {
      expect(response.body.message).toContain(msg);
    });
  });

  it('/auth/login (POST) - should throw Unauthorized with unknown email', async () => {
    const dto: LoginUserDto = {
      email: 'unknown@email.com',
      password: 'm1P4s&w0Rd',
    };

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(dto);

    expect(response.body).toEqual({
      message: 'Credentials are not valid (email)',
      error: 'Unauthorized',
      statusCode: 401,
    });
  });

  it('/auth/login (POST) - should throw Unauthorized with invalid password', async () => {
    const dto: LoginUserDto = {
      email: testingUser.email,
      password: 'm1P4s&w0Rd',
    };

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(dto);

    expect(response.body).toEqual({
      message: 'Credentials are not valid (password)',
      error: 'Unauthorized',
      statusCode: 401,
    });
  });

  it('/auth/login (POST) - should login with valid credentials', async () => {
    const dto: LoginUserDto = {
      email: testingUser.email,
      password: testingUser.password,
    };

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(dto);

    expect(response.status).toBe(201);

    expect(response.body).toEqual({
      user: {
        id: expect.any(String),
        email: testingUser.email,
        fullName: testingUser.fullName,
        isActive: true,
        roles: ['user'],
      },
      token: expect.any(String),
    });
  });
});
