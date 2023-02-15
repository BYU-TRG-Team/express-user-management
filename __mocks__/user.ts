const mock = (methods: {[key: string]: jest.Mock} = {}) => ({
  create: jest.fn(),
  setAttributes: jest.fn(),
  findUsers: jest.fn(),
  getAllUsers: jest.fn(),
  deleteUser: jest.fn(),
  ...methods,
});

export default mock;
