import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { JwtPayload } from '../interfaces';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const mockUserRepository = {
    findOneBy: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret'),
  };

  let strategy: JwtStrategy;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should validate and return user if user exists and is active', async () => {
    const payload: JwtPayload = { id: '123ABC' };
    const mockUser = {
      id: payload.id,
      isActive: true,
    } as User;

    jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(mockUser);

    const user = await strategy.validate(payload);

    expect(userRepository.findOneBy).toHaveBeenCalledWith({ id: payload.id });
    expect(user).toEqual(mockUser);
    expect(user.isActive).toBeTruthy();
  });

  it('should throw UnauthorizedException if user does not exist', async () => {
    const payload: JwtPayload = { id: '123ABC' };
    const mockUser = null;
    jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(mockUser);

    expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    expect(strategy.validate(payload)).rejects.toThrow('Token not valid');
  });

  it('should throw UnauthorizedException if user is inactive', async () => {
    const payload: JwtPayload = { id: '123ABC' };
    const mockUser = {
      id: payload.id,
      isActive: false,
    } as User;

    jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(mockUser);

    expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    expect(strategy.validate(payload)).rejects.toThrow(
      'User is inactive, talk with an admin',
    );
  });
});
