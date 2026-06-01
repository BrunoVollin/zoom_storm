import { IdType } from '../../src/domain/shared/IdType';

export function createIdFromString(value: string): IdType {
  return IdType.create(value);
}