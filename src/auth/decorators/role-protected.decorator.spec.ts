import { SetMetadata } from '@nestjs/common';
import { ValidRoles } from '../interfaces';
import { META_ROLES, RoleProtected } from './role-protected.decorator';

//? simplified, only for toHaveBeenCalled, toHaveBeenCalledWith, etc.
// jest.mock('@nestjs/common', () => ({
//   SetMetadata: jest.fn(),
// }));

//? Better if we want to test something like:
//? expect(result).toEqual({ key: META_ROLES, value: ['admin', 'super-user'] });
jest.mock('@nestjs/common', () => ({
  SetMetadata: jest.fn().mockImplementation((key, value) => ({
    key,
    value,
  })),
}));

describe('RoleProtectedDecorator', () => {
  it('should call setMetadata with given valid roles', () => {
    const validRoles: ValidRoles[] = [ValidRoles.admin, ValidRoles.superUser];

    const result = RoleProtected(...validRoles);

    expect(SetMetadata).toHaveBeenCalled();
    expect(SetMetadata).toHaveBeenCalledWith(META_ROLES, validRoles);
    expect(result).toEqual({ key: META_ROLES, value: ['admin', 'super-user'] });
  });
});
