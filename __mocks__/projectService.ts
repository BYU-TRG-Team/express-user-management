/* eslint-disable no-undef */
export default (methods: {[key: string]: jest.Mock}) => ({
  createProject: jest.fn(),
  mapUsertoProject: jest.fn(),
  getAllProjects: jest.fn(),
  getProjectsByUserId: jest.fn(),
  deleteProjectById: jest.fn(),
  deleteUserFromAllProjects: jest.fn(),
  getProjectById: jest.fn(),
  getProjectUsersById: jest.fn(),
  deleteUserFromProject: jest.fn(),
  setProjectAttributes: jest.fn(),
  ...methods,
});
