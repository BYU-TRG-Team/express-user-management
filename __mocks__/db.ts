const mock = (
  user: { [key: string]: jest.Mock<any, any>; }, 
  token: { [key: string]: jest.Mock<any, any>; }
) => ({
  pool: {
    connect() {
      return this;
    },
    query: jest.fn(),
    release: jest.fn(),
  },
  objects: {
    User: user,
    Token: token,
  },
  query: jest.fn(),
});

export default mock;