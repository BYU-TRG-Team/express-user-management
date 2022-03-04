/* eslint-disable no-undef */
export default (methods: {[key: string]: jest.Mock} = {}) => ({
  create: jest.fn(() => new Promise<void>((resolve) => resolve())),
  deleteToken: jest.fn(),
  findTokens: jest.fn(),
  ...methods,
});
