import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/user.entity';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { DataSource, Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductImage } from './entities';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let productsRepository: Repository<Product>;
  let productImageRepository: Repository<ProductImage>;
  let datasource: DataSource;
  let loggerSpy: jest.SpyInstance;
  let mockQueryRunner: {
    connect: jest.Mock;
    startTransaction: jest.Mock;
    manager: {
      delete: jest.Mock;
      save: jest.Mock;
    };
    commitTransaction: jest.Mock;
    release: jest.Mock;
    rollbackTransaction: jest.Mock;
  };

  beforeEach(async () => {
    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      manager: {
        delete: jest.fn(),
        save: jest.fn(),
      },
      commitTransaction: jest.fn(),
      release: jest.fn(),
      rollbackTransaction: jest.fn(),
    };

    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(), //? or jest.fn(()=> mockQueryBuilder)
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({
        id: 'abc123',
        title: 'mock product',
        slug: 'product-1',
        images: [{ id: '1', url: 'image.jpg' }],
      }),
    };

    const mockProductRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      findOneBy: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      preload: jest.fn(),
    } as unknown as Repository<Product>;

    const mockProductImageRepository = {
      create: jest.fn(),
    } as unknown as Repository<ProductImage>;

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(ProductImage),
          useValue: mockProductImageRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productsRepository = module.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
    productImageRepository = module.get<Repository<ProductImage>>(
      getRepositoryToken(ProductImage),
    );
    datasource = module.get<DataSource>(DataSource);

    loggerSpy = jest
      //? Required when logger is within the class (ProductsService has it as private prop)
      //? private readonly logger = new Logger('ProductsService');
      .spyOn((service as any).logger, 'error')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a valid product', async () => {
    const dto: CreateProductDto = {
      title: 'test product',
      sizes: ['SM'],
      gender: 'unisex',
      tags: ['test'],
      images: ['image1.jpg', 'image2.jpg'],
    } as CreateProductDto;

    const { images: dtoWithoutImages, ...createDto } = dto;

    const user: User = {
      id: '123ABC',
    } as User;

    const product = {
      ...createDto,
      id: 1,
      user,
    } as unknown as Product;

    jest.spyOn(productsRepository, 'create').mockReturnValue(product);
    jest.spyOn(productsRepository, 'save').mockResolvedValue(product);
    jest
      .spyOn(productImageRepository, 'create')
      .mockReturnValue({} as ProductImage);

    const result = await service.create(dto, user);
    expect(productsRepository.create).toHaveBeenCalledWith({
      ...dto,
      images: expect.any(Array),
      user,
    });
    expect(productsRepository.save).toHaveBeenCalled();
    expect(result).toEqual({
      ...dto,
      id: 1,
      user,
    });
  });

  it('should throw a BadRequestException if product already exist', async () => {
    const error = {
      code: '23505',
      detail: 'Cannot create product because XYZ',
    };
    jest.spyOn(productsRepository, 'save').mockRejectedValue(error);

    await expect(
      service.create({} as CreateProductDto, {} as User),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.create({} as CreateProductDto, {} as User),
    ).rejects.toThrow('Cannot create product because XYZ');
  });

  it('should throw a BadRequestException if product creation fails', async () => {
    const error = {
      code: '0000',
      detail: 'unhandled error',
    };
    jest.spyOn(productsRepository, 'save').mockRejectedValue(error);

    await expect(
      service.create({} as CreateProductDto, {} as User),
    ).rejects.toThrow(InternalServerErrorException);
    await expect(
      service.create({} as CreateProductDto, {} as User),
    ).rejects.toThrow('Unexpected error, check server logs');

    //? Called after fail the creation
    expect(loggerSpy).toHaveBeenCalledWith(error);
  });

  it('should find all products', async () => {
    const dto: PaginationDto = { limit: 2, offset: 0, gender: 'unisex' };

    const MOCK_PRODUCTS: Product[] = [
      {
        id: '05965bd9-ba61-4986-b386-66ca35729d23',
        title: "Women's Chill Half Zip Cropped Hoodie",
        price: 130,
        slug: 'women_chill_half_zip_cropped_hoodie',
        stock: 10,
        sizes: ['XS', 'S', 'M', 'XXL'],
        gender: 'women',
        tags: ['hoodie'],
        images: [{ url: 'image.jpg' }],
      },
      {
        id: '11b22691-c013-4a4a-85c9-8c418f6397a5',
        title: "Men's Cyber truck Owl Tee",
        price: 35,
        slug: 'men_cyber_truck_owl_tee',
        stock: 0,
        sizes: ['M', 'L', 'XL', 'XXL'],
        gender: 'men',
        tags: ['shirt'],
        images: [{ url: 'image.jpg' }],
      },
    ] as Product[];

    jest.spyOn(productsRepository, 'find').mockResolvedValue(MOCK_PRODUCTS);
    jest
      .spyOn(productsRepository, 'count')
      .mockResolvedValue(MOCK_PRODUCTS.length);

    const result = await service.findAll(dto);

    expect(result).toEqual({
      count: MOCK_PRODUCTS.length,
      pages: Math.ceil(MOCK_PRODUCTS.length / dto.limit),
      products: MOCK_PRODUCTS.map((product) => ({
        ...product,
        images: product.images.map((image) => image.url),
      })),
    });
  });

  it('should find product by uuid', async () => {
    const mockedUuid = '16b65bed-9459-4b41-a311-6cca072e2a6c';
    const mockedProduct = {
      id: mockedUuid,
      title: 'mocked title',
    } as unknown as Product;

    jest
      .spyOn(productsRepository, 'findOneBy')
      .mockResolvedValue(mockedProduct);

    const product = await service.findOne(mockedUuid);

    expect(product).toBeDefined();
    expect(product.id).toBe(mockedUuid);
    expect(product).toEqual(mockedProduct);
  });

  it('should throw NotFoundException if product with given uuid does not exist', async () => {
    const mockedUuid = '16b65bed-9459-4b41-a311-6cca072e2a6c';

    jest.spyOn(productsRepository, 'findOneBy').mockResolvedValue(null);

    await expect(service.findOne(mockedUuid)).rejects.toThrow(
      NotFoundException,
    );
    await expect(service.findOne(mockedUuid)).rejects.toThrow(
      `Product with ${mockedUuid} not found`,
    );
  });

  it('should return product by term or slug', async () => {
    const result = await service.findOne('title');
    expect(result).toEqual({
      id: 'abc123',
      title: 'mock product',
      slug: 'product-1',
      images: [{ id: '1', url: 'image.jpg' }],
    });
  });

  it('should throw NotFoundException if product not found ', async () => {
    jest.spyOn(productsRepository, 'preload').mockResolvedValue(null);

    await expect(
      service.update('1', {} as UpdateProductDto, {} as User),
    ).rejects.toThrow(NotFoundException);
    await expect(
      service.update('1', {} as UpdateProductDto, {} as User),
    ).rejects.toThrow('Product with id: 1 not found');
    //? other way
    await expect(
      service.update('1', {} as UpdateProductDto, {} as User),
    ).rejects.toThrow(new NotFoundException('Product with id: 1 not found'));
  });

  it('should update product successfully ', async () => {
    const productId = 'ABC123';
    const dto = { title: 'updated title' } as UpdateProductDto;
    const user = { id: '1', fullName: 'Luciano Figueroa' } as User;
    const product = {
      ...dto,
      id: productId,
      price: 100,
      description: 'mock description',
    } as unknown as Product;
    jest.spyOn(productsRepository, 'preload').mockResolvedValue(product);

    const updatedProduct = await service.update(productId, dto, user);
    expect(updatedProduct).toEqual({
      id: 'abc123',
      title: 'mock product',
      slug: 'product-1',
      images: ['image.jpg'],
    });
  });

  it('should update product and commit transaction', async () => {
    const productId = 'ABC123';

    const dto = {
      title: 'updated title',
      images: [{ id: '1', url: 'image.jpg' }],
    } as unknown as UpdateProductDto;

    const user = { id: '1', fullName: 'Luciano Figueroa' } as User;

    const product = {
      ...dto,
      id: productId,
      price: 100,
      description: 'mock description',
    } as unknown as Product;

    jest.spyOn(productsRepository, 'preload').mockResolvedValue(product);

    await service.update(productId, dto, user);

    expect(mockQueryRunner.connect).toHaveBeenCalled();
    expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.manager.delete).toHaveBeenCalled();
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.release).toHaveBeenCalled();
  });

  it('should throw error if update fails', async () => {
    const productId = 'ABC123';

    const dto = {
      title: 'updated title',
      images: [{ id: '1', url: 'image.jpg' }],
    } as unknown as UpdateProductDto;

    const user = { id: '1', fullName: 'Luciano Figueroa' } as User;

    const product = {
      ...dto,
      id: productId,
      price: 100,
      description: 'mock description',
    } as unknown as Product;

    jest.spyOn(productsRepository, 'preload').mockResolvedValue(product);
    jest
      .spyOn(mockQueryRunner.manager, 'save')
      .mockRejectedValue(InternalServerErrorException);

    await expect(service.update(productId, dto, user)).rejects.toThrow(
      InternalServerErrorException,
    );

    expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.release).toHaveBeenCalled();
  });
});
