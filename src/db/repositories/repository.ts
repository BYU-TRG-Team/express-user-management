import { UUID } from "@typings";

abstract class Repository<T> {
  abstract getAll(): Promise<T[]>
  abstract getByUUID(uuid: UUID): Promise<T | null>;
  abstract create(entity: T): Promise<void>;
  abstract update(entity: T): Promise<void>;
  abstract delete(entity: T): Promise<void>;
}

export default Repository;