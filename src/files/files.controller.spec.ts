import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

describe('FilesController', () => {
  let controller: FilesController;
  let service: FilesService;
  let mockConfigService: ConfigService;

  const mockFilesService = {
    getStaticProductImage: jest.fn(),
  };

  mockConfigService = {
    get: jest.fn().mockReturnValue('http://localhost:3000'),
  } as unknown as ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        { provide: FilesService, useValue: mockFilesService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<FilesController>(FilesController);
    service = module.get<FilesService>(FilesService);
  });

  it('should be defined', async () => {
    expect(controller).toBeDefined();
  });

  it('should return file path when findProductImage is called', async () => {
    const mockResponse = {
      sendFile: jest.fn(),
    } as unknown as Response;

    const mockImageName = 'product-image-name.jpg';
    const mockImagePath = `/static/products/${mockImageName}`;

    jest.spyOn(service, 'getStaticProductImage').mockReturnValue(mockImagePath);

    controller.findProductImage(mockResponse, mockImageName);

    expect(service.getStaticProductImage).toHaveBeenCalledWith(mockImageName);
    expect(mockResponse.sendFile).toHaveBeenCalled();
    expect(mockResponse.sendFile).toHaveBeenCalledWith(mockImagePath);
  });

  it('should return a secure url when uploadProductImage is called with a valid image file', async () => {
    const mockFile = { filename: 'test-file.jpg' } as Express.Multer.File;
    const secureUrl = `${mockConfigService.get('HOST_API')}/files/product/${
      mockFile.filename
    }`;

    const result = controller.uploadProductImage(mockFile);

    expect(result).toEqual({
      secureUrl,
      fileName: mockFile.filename,
    });
  });

  it('should throw BadRequestException if uploadProductImage is called without an image file', async () => {
    expect(() => controller.uploadProductImage(null)).toThrow(
      BadRequestException,
    );
    expect(() => controller.uploadProductImage(null)).toThrow(
      'Make sure that the file is an image',
    );
  });
});
