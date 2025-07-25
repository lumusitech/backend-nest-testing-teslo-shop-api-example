import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';

import { AuthController } from './auth.controller';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';

// IMPORTANT: Mock TypeOrmModule to prevent real database connection attempts
// This mock ensures that TypeOrmModule itself is a class that can be exported,
// and its static methods like `forFeature` are also mocked.
jest.mock('@nestjs/typeorm', () => {
  // Get the actual implementations for decorators and tokens
  const actualTypeOrm = jest.requireActual('@nestjs/typeorm');

  // Create a mock TypeOrmModule class
  class MockTypeOrmModule {
    // Mock the static `forFeature` method to return a dummy module definition
    // This mock now correctly provides and exports the repository token,
    // simulating the behavior of the real TypeOrmModule.forFeature
    static forFeature = jest.fn((entities) => ({
      module: MockTypeOrmModule, // Refer to this mock class as the module itself
      providers: entities.map((entity: any) => ({
        provide: getRepositoryToken(entity), // Provide the token for the entity's repository
        useValue: {}, // A placeholder value, the actual mock will come from the test module
      })),
      exports: entities.map((entity: any) => getRepositoryToken(entity)), // Export the repository token
    }));

    // If your AuthModule uses TypeOrmModule.forRoot or other static methods,
    // you would mock them similarly here.
    // static forRoot = jest.fn(() => ({ module: MockTypeOrmModule, providers: [], exports: [] }));
  }

  return {
    ...actualTypeOrm, // Spread actual exports to retain other decorators/functions (like InjectRepository, getRepositoryToken)
    TypeOrmModule: MockTypeOrmModule, // Replace the TypeOrmModule with our mock class
  };
});

describe('AuthModule', () => {
  let module: TestingModule;
  let authController: AuthController;
  let authService: AuthService;
  let configService: ConfigService;
  let jwtStrategy: JwtStrategy;

  const mockUserRepository = {
    create: jest.fn((dto) => dto),
    save: jest.fn((user) => ({ ...user, id: 'mock-id' })),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    // Clear the mock for TypeOrmModule.forFeature before each test
    // This ensures that each test starts with a clean mock state.
    (TypeOrmModule.forFeature as jest.Mock).mockClear();

    module = await Test.createTestingModule({
      imports: [
        // AuthModule will internally use the mocked TypeOrmModule.forFeature
        AuthModule,
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              JWT_SECRET: 'test-jwt-secret-for-testing',
            }),
          ],
        }),
      ],
      providers: [
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    configService = module.get<ConfigService>(ConfigService);
    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should have AuthService as provider', () => {
    const service = module.get<AuthService>(AuthService);
    expect(service).toBeDefined();
  });

  it('should have AuthController as controller', () => {
    const controller = module.get<AuthController>(AuthController);
    expect(controller).toBeDefined();
  });

  it('should have JwtStrategy as provider', () => {
    const provider = module.get<JwtStrategy>(JwtStrategy);
    expect(provider).toBeDefined();
  });

  it('should have JwtModule as module', () => {
    const jwtModule = module.get<JwtModule>(JwtModule);
    expect(jwtModule).toBeDefined();
  });
});
