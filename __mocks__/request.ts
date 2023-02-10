const mock = (attributes: {[key: string]: any}) => ({
  role: 'superadmin',
  userId: 10,
  ...attributes,
});

export default mock;
