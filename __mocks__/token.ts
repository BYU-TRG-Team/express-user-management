const mock = (methods: {[key: string]: jest.Mock} = {}) => ({
  create: jest.fn(() => new Promise<void>((resolve) => resolve())),
  deleteToken: jest.fn(),
  findTokens: jest.fn(),
  ...methods,
});

export default mock;
