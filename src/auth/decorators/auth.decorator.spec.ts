import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRoleGuard } from '../guards/user-role.guard';
import { ValidRoles } from '../interfaces';
import { Auth } from './auth.decorator';
import { RoleProtected } from './role-protected.decorator';

jest.mock('@nestjs/passport', () => ({
  AuthGuard: jest.fn(() => 'AuthGuard'),
}));

jest.mock('../guards/user-role.guard', () => ({
  UserRoleGuard: jest.fn(() => 'UserRoleGuard'),
}));

jest.mock('./role-protected.decorator', () => ({
  RoleProtected: jest.fn(() => 'RoleProtected'),
}));

jest.mock('@nestjs/common', () => ({
  applyDecorators: jest.fn(() => 'applyDecorators'),
  UseGuards: jest.fn(),
}));

describe('AuthDecorator', () => {
  it('should call apply decorators with RoleProtected and UseGuards', () => {
    const roles: ValidRoles[] = [ValidRoles.admin, ValidRoles.superUser];

    Auth(...roles);

    expect(applyDecorators).toHaveBeenCalledWith(
      RoleProtected(...roles),
      UseGuards(AuthGuard(), UserRoleGuard),
    );
  });
});
