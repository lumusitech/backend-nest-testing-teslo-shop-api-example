import { User } from './user.entity';

describe('UserEntity', () => {
  it('should has all correct properties', () => {
    const user = new User();

    console.log(user);
    expect(user).toBeInstanceOf(User);
  });

  it('should clear email before insert', () => {
    const user = new User();
    user.email = ' emAil@eMail.com  ';
    user.checkFieldsBeforeInsert();

    expect(user.email).toBe('email@email.com');
  });

  it('should clear email before update', () => {
    const user = new User();
    user.email = ' emAil@eMail.com  ';
    user.checkFieldsBeforeUpdate();

    expect(user.email).toBe('email@email.com');
  });
});
