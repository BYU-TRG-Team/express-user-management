const pg = jest.createMockFromModule("pg") as any;

export class PoolClient {
  query = jest.fn(() => new Promise<void>((resolve) => resolve()));
  release = jest.fn(() => ({}));
}

class Pool {
  query = jest.fn(() => new Promise<void>((resolve) => resolve()));
  connect = jest.fn(() => new Promise<PoolClient>((resolve) => resolve(new PoolClient())));
}

pg.Pool = Pool;

export default pg;