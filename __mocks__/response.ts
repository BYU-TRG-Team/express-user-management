const response = (methods: {[key: string]: jest.Mock} = {}) => ({
  status() {
    return this;
  },

  send() {
    return this;
  },

  json() {
    return this;
  },

  cookie() {
    return this;
  },

  redirect() {
    return this;
  },
  ...methods,
});

export default response;
