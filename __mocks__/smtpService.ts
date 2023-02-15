const mock = (methods: {[key: string]: jest.Mock} = {}) => ({
  sendEmail: jest.fn(() => new Promise<void>((resolve) => resolve())),
  ...methods,
});

export default mock;
