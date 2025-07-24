import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRoleGuard } from './user-role.guard';

describe('UserRoleGuard', () => {
  let guard: UserRoleGuard;
  let reflector: Reflector;
  let mockExecutionContext: ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn(() => ({
          user: undefined,
        })),
      }),
      getHandler: jest.fn(),
    } as unknown as ExecutionContext;

    guard = new UserRoleGuard(reflector);
  });

  it('should return true if no roles are not present', () => {
    jest.spyOn(reflector, 'get').mockReturnValue(undefined);

    expect(guard.canActivate(mockExecutionContext)).toBeTruthy();
  });

  it('should return true if no roles are required', () => {
    jest.spyOn(reflector, 'get').mockReturnValue([]); //? no roles required

    expect(guard.canActivate(mockExecutionContext)).toBeTruthy();
  });

  it('should throw BadRequestException if user is not present', () => {
    jest.spyOn(reflector, 'get').mockReturnValue(['admin']);

    try {
      expect(guard.canActivate(mockExecutionContext)).toBeTruthy();
      expect(true).toBeFalsy();
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.status).toBe(400);
      expect(error.message).toBe('User not found');
    }
  });

  it('should throw BadRequestException if user is not present - Option 2', () => {
    jest.spyOn(reflector, 'get').mockReturnValue(['admin']);

    //? Other way to mock and simulate that user is not defined
    jest
      .spyOn(mockExecutionContext.switchToHttp(), 'getRequest')
      .mockReturnValue({});

    expect(() => guard.canActivate(mockExecutionContext)).toThrow(
      BadRequestException,
    );
    expect(() => guard.canActivate(mockExecutionContext)).toThrow(
      'User not found',
    );
  });

  it('should throw ForbiddenException if user lacks required roles', () => {
    const validRoles = ['admin'];

    const mockUser = {
      id: '123ABC',
      email: 'lu@email.com',
      roles: ['user'], //? role user do not access
      fullName: 'Luciano Figueroa',
    };

    jest.spyOn(reflector, 'get').mockReturnValue(validRoles); //? Only admin role can access
    jest
      .spyOn(mockExecutionContext.switchToHttp(), 'getRequest')
      .mockReturnValue({ user: mockUser });

    expect(() => guard.canActivate(mockExecutionContext)).toThrow(
      ForbiddenException,
    );
    expect(() => guard.canActivate(mockExecutionContext)).toThrow(
      `User ${mockUser.fullName} need a valid role: [${validRoles.join(',')}]`,
    );
  });

  it('should return true if user has the required roles', () => {
    const mockUser = {
      id: '123ABC',
      email: 'lu@email.com',
      roles: ['admin'], //? role admin can access
      fullName: 'Luciano Figueroa',
    };

    jest.spyOn(reflector, 'get').mockReturnValue(['admin']); //? Only admin role can access
    jest
      .spyOn(mockExecutionContext.switchToHttp(), 'getRequest')
      .mockReturnValue({ user: mockUser });

    expect(guard.canActivate(mockExecutionContext)).toBeTruthy();
  });
});
