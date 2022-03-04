/* eslint-disable no-undef */
export default (methods: {[key: string]: jest.Mock} = {}) => ({
  sendEmail: jest.fn(() => new Promise<void>((resolve) => resolve())),
  ...methods,
});
