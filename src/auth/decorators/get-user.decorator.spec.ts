import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { getUser } from './get-user.decorator';

jest.mock('@nestjs/common', () => ({
  createParamDecorator: jest.fn(),
  InternalServerErrorException:
    jest.requireActual('@nestjs/common').InternalServerErrorException,
}));

describe('GetUserDecorator', () => {
  const mockExecutionContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        user: {
          id: 'ABC123',
          email: 'some@email',
          fullname: 'some full name',
        },
      }),
    }),
  } as unknown as ExecutionContext;

  const mockExecutionContextWithUndefinedUser = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        user: undefined,
      }),
    }),
  } as unknown as ExecutionContext;

  it('should return the user from the request', () => {
    const result = getUser('', mockExecutionContext);

    expect(result).toEqual({
      id: 'ABC123',
      email: 'some@email',
      fullname: 'some full name',
    });
  });

  it('should call createParamDecorator with getUser', () => {
    expect(createParamDecorator).toHaveBeenCalled();
    expect(createParamDecorator).toHaveBeenCalledWith(getUser);
  });

  it('should return the required data', () => {
    const id = getUser('id', mockExecutionContext);
    expect(id).toBe('ABC123');
    const email = getUser('email', mockExecutionContext);
    expect(email).toBe('some@email');
    const fullname = getUser('fullname', mockExecutionContext);
    expect(fullname).toBe('some full name');
  });

  it('should throw an internal server error if user not found', () => {
    try {
      getUser(null, mockExecutionContextWithUndefinedUser);
      expect(true).toBeFalsy();
    } catch (error) {
      expect(error).toBeInstanceOf(InternalServerErrorException);
      expect(error.message).toBe('User not found (request)');
    }
  });
});
