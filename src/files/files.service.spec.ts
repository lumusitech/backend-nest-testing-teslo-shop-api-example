import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { existsSync } from 'fs';
import { join } from 'path';
import { FilesService } from './files.service';

jest.mock('fs', () => ({
  existsSync: jest.fn(),
}));

describe('FilesService', () => {
  let service: FilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FilesService],
    }).compile();

    service = module.get<FilesService>(FilesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });

  it('should return a correct path if image exists', async () => {
    const imageName = 'fake-image-name.jpg';
    const expectedPath = join(__dirname, '../../static/products', imageName);

    (existsSync as jest.Mock).mockReturnValue(true);

    const result = service.getStaticProductImage(imageName);
    expect(result).toBe(expectedPath);
  });

  it('should throw BadRequestException if image does not exist', async () => {
    const imageName = 'no-image.jpg';

    (existsSync as jest.Mock).mockReturnValue(false);

    expect(() => service.getStaticProductImage(imageName)).toThrow(
      BadRequestException,
    );
    expect(() => service.getStaticProductImage(imageName)).toThrow(
      'No product found with image no-image.jpg',
    );
  });
});
