const { userSchema } = require('../validation/userSchema');
const { taskSchema, patchTaskSchema } = require('../validation/taskSchema');

describe('user object validation tests', () => {
  it("1. doesn't permit a trivial password", () => {
    const { error } = userSchema.validate(
      { name: 'Bob', email: 'bob@sample.com', password: 'password' },
      { abortEarly: false },
    );
    expect(
      error.details.find((detail) => detail.context.key == 'password'),
    ).toBeDefined();
  });

  it('2. requires that an email be specified', () => {
    const { error } = userSchema.validate(
      { name: 'Bob', password: 'Stinky123!' },
      { abortEarly: false },
    );
    expect(
      error.details.find((detail) => detail.context.key === 'email'),
    ).toBeDefined();
  });

  it('3. does not accept an invalid email', () => {
    const { error } = userSchema.validate(
      { name: 'Bob', email: 'email', password: 'Stinky123!' },
      { abortEarly: false },
    );
    expect(
      error.details.find((detail) => detail.context.key == 'email'),
    ).toBeDefined();
  });

  it('4. requires a password', () => {
    const { error } = userSchema.validate(
      { name: 'Bob', email: 'bob@sample.com' },
      { abortEarly: false },
    );
    expect(
      error.details.find((detail) => detail.context.key == 'password'),
    ).toBeDefined();
  });

  it('5. requires a name', () => {
    const { error } = userSchema.validate(
      { email: 'bob@sample.com', password: 'password' },
      { abortEarly: false },
    );
    expect(
      error.details.find((detail) => detail.context.key == 'name'),
    ).toBeDefined();
  });

  it('6. the name must be valid (3 to 30 characters)', () => {
    const { error } = userSchema.validate(
      { name: 'hi', email: 'bob@sample.com', password: 'Stinky123!' },
      { abortEarly: false },
    );
    expect(
      error.details.find((detail) => detail.context.key == 'name'),
    ).toBeDefined();
  });

  it('7. if validation is performed on a valid user object, error comes back falsy', () => {
    const { error } = userSchema.validate(
      { name: 'Bob', email: 'bob@sample.com', password: 'Stinky123!' },
      { abortEarly: false },
    );
    expect(error).toBeFalsy();
  });
});

describe('task object validation tests', () => {
  it('8. requires a title', () => {
    const { error } = taskSchema.validate(
      { isCompleted: false, priority: 'medium' },
      { abortEarly: false },
    );
    expect(
      error.details.find((detail) => detail.context.key == 'title'),
    ).toBeDefined();
  });

  it('9. if an isCompleted value is specified, it must be valid', () => {
    const { error } = taskSchema.validate(
      { title: 'Feed the fish', isCompleted: 'no', priority: 'medium' },
      { abortEarly: false },
    );
    expect(
      error.details.find((detail) => detail.context.key == 'isCompleted'),
    ).toBeDefined();
  });

  it('10. if an isCompleted value is not specified but the rest of the object is valid, a default of false is provided by validation', () => {
    const { error, value } = taskSchema.validate(
      { title: 'Feed the fish', priority: 'medium' },
      { abortEarly: false },
    );
    expect(
      value.isCompleted).toBe(false);
  });
  
  it('11. if isCompleted in the provided object has the value true, it remains true after validation', () => {
    const { error, value } = taskSchema.validate(
      { title: 'Feed the fish', isCompleted: true, priority: 'medium' },
      { abortEarly: false },
    );
    expect(value.isCompleted).toBe(true);
  });
});

describe('patch task validation tests', () => {
  it('12. does not require a title', () => {
    const { error } = patchTaskSchema.validate(
      { isCompleted: false, priority: 'medium' },
      { abortEarly: false },
    );
    expect(error).toBeFalsy();
  });

  it('13. if no value is provided for isCompleted this remains undefined in the returned value', () => {
    const { error, value } = patchTaskSchema.validate(
      { title: 'Feed the fish', priority: 'medium' },
      { abortEarly: false },
    );
    expect(value.isCompleted).toBe(undefined);
  });
});
