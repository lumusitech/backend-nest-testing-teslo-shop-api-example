import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { IncomingHttpHeaders } from 'http';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from './dto';
import { User } from './entities/user.entity';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const mockAuthService = {
      login: jest.fn(),
      create: jest.fn(),
      checkAuthStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  it('should call authService create method with given DTO', async () => {
    const dto: CreateUserDto = {
      email: 'test@email.com',
      password: 'm1P@s$woRD',
      fullName: 'Test User',
    };

    await authController.createUser(dto);

    expect(authService.create).toHaveBeenCalledWith(dto);
  });

  it('should call authService login method with given DTO', async () => {
    const dto: LoginUserDto = {
      email: 'test@email.com',
      password: 'm1P@s$woRD',
    };

    await authController.loginUser(dto);

    expect(authService.login).toHaveBeenCalledWith(dto);
  });

  it('should call authService checkAuthStatus method with given DTO', async () => {
    const mockUser = {
      email: 'test@email.com',
      password: 'm1P@s$woRD',
    } as User;

    await authController.checkAuthStatus(mockUser);

    expect(authService.checkAuthStatus).toHaveBeenCalledWith(mockUser);
  });

  it('should return private route data ', async () => {
    // @Req() request: Express.Request,
    // @GetUser() user: User,
    // @GetUser('email') userEmail: string,
    // @RawHeaders() rawHeaders: string[],
    // @Headers() headers: IncomingHttpHeaders,
    const mockRequest = {} as Express.Request;
    const mockUser = { id: '1', email: 'test@email.com' } as User;
    const mockRawHeaders = ['header1:value1', 'header2:value2'];
    const mockHeaders = {
      header1: 'value1',
      header2: 'value2',
    } as IncomingHttpHeaders;

    const result = authController.testingPrivateRoute(
      mockRequest,
      mockUser,
      mockUser.email,
      mockRawHeaders,
      mockHeaders,
    );
    expect(result).toEqual({
      ok: true,
      message: 'Hello world Private',
      user: mockUser,
      userEmail: mockUser.email,
      rawHeaders: mockRawHeaders,
      headers: mockHeaders,
    });
  });
});
