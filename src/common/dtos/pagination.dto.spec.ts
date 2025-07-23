import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { PaginationDto } from './pagination.dto';

describe('PaginationDto', () => {
  it('should validate with default values', async () => {
    const dto = plainToClass(PaginationDto, {});

    const errors = await validate(dto);

    expect(dto).toBeDefined();
    expect(errors.length).toBe(0);
  });

  it('should validate all correct props', async () => {
    const dto = new PaginationDto();

    dto.limit = 1;
    dto.offset = 1;
    dto.gender = 'kid';

    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('should throws error with invalid limit', async () => {
    const dto = new PaginationDto();

    dto.limit = -1;
    dto.offset = 1;
    dto.gender = 'kid';

    const errors = await validate(dto);
    const limitError = errors.find((error) => error.property === 'limit');

    expect(limitError).toBeDefined();
    expect(limitError.constraints).toBeDefined();
    expect(limitError.constraints.isPositive).toBeDefined();
    expect(limitError.constraints.isPositive).toBe(
      'limit must be a positive number',
    );
  });

  it('should throws error with invalid page', async () => {
    const dto = new PaginationDto();

    dto.limit = 1;
    dto.offset = -1;
    dto.gender = 'kid';

    const errors = await validate(dto);
    const offsetError = errors.find((error) => error.property === 'offset');

    expect(offsetError).toBeDefined();
    expect(offsetError.constraints).toBeDefined();
    expect(offsetError.constraints.min).toBeDefined();
    expect(offsetError.constraints.min).toBe('offset must not be less than 0');
  });

  it('should throws error with invalid gender', async () => {
    const dto = new PaginationDto();

    dto.limit = 1;
    dto.offset = 1;
    dto.gender = 'invalid-gender' as null;

    const errors = await validate(dto);
    const genderError = errors.find((error) => error.property === 'gender');

    expect(genderError).toBeDefined();
    expect(genderError.constraints).toBeDefined();
    expect(genderError.constraints.isIn).toBeDefined();
    expect(genderError.constraints.isIn).toBe(
      'gender must be one of the following values: men, women, unisex, kid',
    );
  });

  it('should validate all correct genders', async () => {
    const validGenders = ['men', 'women', 'unisex', 'kid'];

    validGenders.forEach(async (validGender) => {
      const dto = plainToClass(PaginationDto, { gender: validGender });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  it('should throws error with invalid role', async () => {
    const invalidGenders = ['invalid-gender', 'wrong-gender', 'wrong'];

    invalidGenders.forEach(async (gender) => {
      const dto = plainToClass(PaginationDto, { gender });
      const errors = await validate(dto);
      const genderError = errors.find((error) => error.property === 'gender');
      expect(genderError).toBeDefined();
      expect(genderError.constraints).toBeDefined();
      expect(genderError.constraints.isIn).toBeDefined();
      expect(genderError.constraints.isIn).toBe(
        'gender must be one of the following values: men, women, unisex, kid',
      );
    });
  });
});
