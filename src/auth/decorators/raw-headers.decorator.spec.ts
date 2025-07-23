import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { getRawHeaders } from './raw-headers.decorator';

jest.mock('@nestjs/common', () => ({
  // createParamDecorator: jest.fn().mockImplementation(() => jest.fn()),
  //? Easier
  createParamDecorator: jest.fn(),
}));

describe('RawHeaderDecorator', () => {
  const mockExecutionContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        rawHeaders: ['Authorization', 'Bearer Token', 'User-Agent', 'NestJS'],
      }),
    }),
  } as unknown as ExecutionContext;

  it('should return the raw headers from the request', () => {
    //? First test the getRawHeaders using a mock
    const result = getRawHeaders('', mockExecutionContext);

    expect(result).toEqual(
      expect.arrayContaining([
        'Authorization',
        'Bearer Token',
        'User-Agent',
        'NestJS',
      ]),
    );
  });

  //? Then, test that createParamDecorator, from @nestjs/common, has been called
  it('should call createParamDecorator with getRawHeader', () => {
    expect(createParamDecorator).toHaveBeenCalled();
    expect(createParamDecorator).toHaveBeenCalledWith(getRawHeaders);
  });
});
