import { ValidationError } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginUserDto } from './login-user.dto';

describe('LoginUserDto', () => {
  it('should validate all correct props', async () => {
    const dto = new LoginUserDto();

    dto.email = 'lu@email.com';
    dto.password = 'p4sSw@rd';

    const errors: ValidationError[] = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('should has the correct props - other way with plainToClass ', async () => {
    const dto = plainToClass(LoginUserDto, {
      email: 'lu@email.com',
      password: 'p4sSw@rd',
    });

    const errors: ValidationError[] = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('should throws error if password is not valid', async () => {
    const dto = new LoginUserDto();
    dto.email = 'lu@email.com';
    dto.password = 'wrong-pass';

    const errors: ValidationError[] = await validate(dto);
    const passwordError = errors.find((error) => error.property === 'password');

    expect(errors.length).toBeGreaterThanOrEqual(1);
    //? With this progressive verification we can test each nested prop
    expect(passwordError).toBeDefined();
    expect(passwordError.constraints).toBeDefined();
    expect(passwordError.constraints.matches).toBeDefined();
    expect(passwordError.constraints.matches).toBe(
      'The password must have a Uppercase, lowercase letter and a number',
    );
  });

  it('should throws error if email is not valid', async () => {
    const dto = new LoginUserDto();
    dto.email = 'invalid.email.com';
    dto.password = 'p4sSw@rd';

    const errors: ValidationError[] = await validate(dto);

    const emailError = errors.find((error) => error.property === 'email');

    expect(errors.length).toBeGreaterThanOrEqual(1);
    //? With this progressive verification we can test each nested prop
    expect(emailError).toBeDefined();
    expect(emailError.constraints).toBeDefined();
    expect(emailError.constraints.isEmail).toBeDefined();
    expect(emailError.constraints.isEmail).toBe('email must be an email');
  });
});
