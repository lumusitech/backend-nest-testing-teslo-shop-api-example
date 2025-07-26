import {
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from './dto';
import { User } from './entities/user.entity';

describe('AuthService', () => {
  let module: TestingModule;
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a valid user adn return user with token', async () => {
    const dto: CreateUserDto = {
      email: 'email@email.com',
      password: 'aG00Dp4$s',
      fullName: 'Test User',
    };

    const user: User = {
      id: '1',
      email: dto.email,
      fullName: dto.fullName,
      isActive: true,
      roles: ['user'],
    } as User;

    jest.spyOn(userRepository, 'create').mockReturnValue(user);
    jest.spyOn(bcrypt, 'hashSync').mockReturnValue('mock-hashed-password');

    const result = await service.create(dto);

    expect(result).toEqual({
      user,
      token: 'mock-jwt-token',
    });

    expect(bcrypt.hashSync).toHaveBeenCalledWith(dto.password, 10);
  });

  it('should throw a BadRequestException if user email already exists', async () => {
    jest.spyOn(userRepository, 'save').mockRejectedValue({
      code: '23505',
      detail: 'Email already exists',
    });

    await expect(service.create({} as CreateUserDto)).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.create({} as CreateUserDto)).rejects.toThrow(
      'Email already exists',
    );
  });

  it('should throw an InternalServerErrorException', async () => {
    const mockError = { code: '0000', detail: 'unhandled error' };

    jest.spyOn(userRepository, 'save').mockRejectedValue(mockError);
    jest.spyOn(console, 'log').mockImplementation(() => {}); //? or mockReturnValue(null)

    await expect(service.create({} as CreateUserDto)).rejects.toThrow(
      InternalServerErrorException,
    );
    await expect(service.create({} as CreateUserDto)).rejects.toThrow(
      'Please check server logs',
    );
    expect(console.log).toHaveBeenCalledWith(mockError);
  });

  it('should login an user and return token', async () => {
    const dto: LoginUserDto = {
      email: 'test@email.com',
      password: 'm1H4rdP4$s',
    };

    const hashedPassword = 'mock-hashed-password';

    const user: User = {
      id: '1',
      email: dto.email,
      password: hashedPassword,
      fullName: 'Test User',
      isActive: true,
      roles: ['user'],
    } as User;

    jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
    jest.spyOn(bcrypt, 'compareSync').mockReturnValue(true);

    const result = await service.login(dto);
    jest.spyOn(console, 'log').mockRestore();
    console.log(result);

    expect(result).toEqual({ user, token: 'mock-jwt-token' });
    expect(bcrypt.compareSync).toHaveBeenCalledWith(
      dto.password,
      hashedPassword,
    );
    expect(result.user.password).toBeUndefined();
  });

  it('should throw UnauthorizedException if user does not exist', async () => {
    jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

    await expect(service.login({} as LoginUserDto)).rejects.toThrow(
      'Credentials are not valid (email)',
    );

    await expect(service.login({} as LoginUserDto)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if user password is not valid', async () => {
    jest.spyOn(userRepository, 'findOne').mockResolvedValue({} as User);
    jest.spyOn(bcrypt, 'compareSync').mockReturnValue(false);

    await expect(service.login({} as LoginUserDto)).rejects.toThrow(
      'Credentials are not valid (password)',
    );

    await expect(service.login({} as LoginUserDto)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should check auth status and return user with new token', async () => {
    const user: User = {
      id: '1',
      email: 'test@gmail.com',
      fullName: 'Test User',
      isActive: true,
      roles: ['user'],
    } as User;

    const mockedToken = 'mock-jwt-token';

    jest.spyOn(jwtService, 'sign').mockReturnValue(mockedToken);

    const result = await service.checkAuthStatus(user);

    expect(jwtService.sign).toHaveBeenCalledWith({ id: user.id });
    expect(result).toEqual({ user, token: mockedToken });
  });
});
