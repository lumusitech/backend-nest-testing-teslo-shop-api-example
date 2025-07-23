import { JwtPayload } from './jwt-payload.interface';

describe('JwtPayload interface', () => {
  //? This test is needed for avoid adding of others props like name or email
  it('should return true for a valid payload', () => {
    const validPayload: JwtPayload = { id: 'ABC123' };

    expect(validPayload.id).toBe('ABC123');
  });
});
