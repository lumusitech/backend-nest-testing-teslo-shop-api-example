import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { bootstrap } from './main';

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn().mockResolvedValue({
      useGlobalPipes: jest.fn(),
      setGlobalPrefix: jest.fn(),
      enableCors: jest.fn(),
      listen: jest.fn(),
    }),
  },
}));

jest.mock('@nestjs/common', () => ({
  Logger: jest.fn().mockReturnValue({
    log: jest.fn(),
  }),
  ValidationPipe: jest.requireActual('@nestjs/common').ValidationPipe,
}));

jest.mock('@nestjs/swagger', () => ({
  DocumentBuilder: jest.fn().mockReturnValue({
    setTitle: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    setVersion: jest.fn().mockReturnThis(),
    build: jest.fn().mockReturnThis(),
  }),
  ApiProperty: jest.fn(),
  SwaggerModule: {
    setup: jest.fn(),
    createDocument: jest.fn().mockReturnValue('Document'),
  },
}));

jest.mock('./app.module', () => ({
  AppModule: jest.fn().mockReturnValue('AppModule'),
}));

describe('Main', () => {
  //? Define types for the mocked app and logger
  let mockApp: {
    useGlobalPipes: jest.Mock;
    setGlobalPrefix: jest.Mock;
    enableCors: jest.Mock;
    listen: jest.Mock;
  };

  let mockLogger: {
    log: jest.Mock;
  };

  beforeEach(() => {
    mockApp = {
      useGlobalPipes: jest.fn(),
      setGlobalPrefix: jest.fn(),
      enableCors: jest.fn(),
      listen: jest.fn(),
    };

    mockLogger = {
      log: jest.fn(),
    };

    // Mock the NestFactory.create method to return the mock app
    (NestFactory.create as jest.Mock).mockResolvedValue(mockApp);
    (Logger as unknown as jest.Mock).mockReturnValue(mockLogger);
  });

  it('should configure app correctly', async () => {
    await bootstrap();

    expect(NestFactory.create).toHaveBeenCalledWith(AppModule);
    expect(mockApp.enableCors).toHaveBeenCalled();

    expect(mockApp.listen).toHaveBeenCalledWith(3000);
    expect(mockLogger.log).toHaveBeenCalledWith(`App running on port ${3000}`);
  });

  it('should configure app with the given port', async () => {
    process.env.PORT = '3001';

    await bootstrap();

    expect(mockApp.listen).toHaveBeenCalledWith(`${process.env.PORT}`);
    expect(mockLogger.log).toHaveBeenCalledWith(`App running on port ${3001}`);
  });

  it('should set global prefix with api', async () => {
    await bootstrap();
    expect(mockApp.setGlobalPrefix).toHaveBeenCalledWith('api');
  });

  it('should use global pipes', async () => {
    await bootstrap();
    expect(mockApp.useGlobalPipes).toHaveBeenCalledWith(
      expect.objectContaining({
        validatorOptions: expect.objectContaining({
          whitelist: true,
          forbidNonWhitelisted: true,
        }),
      }),
    );
  });

  it('should call DocumentBuilder', async () => {
    await bootstrap();

    expect(DocumentBuilder).toHaveBeenCalled();
    expect(DocumentBuilder).toHaveBeenCalledWith();
  });

  it('should create document', async () => {
    await bootstrap();

    expect(SwaggerModule.createDocument).toHaveBeenCalled();

    expect(SwaggerModule.setup).toHaveBeenCalledWith(
      'api',
      expect.anything(),
      'Document',
    );
  });
});
