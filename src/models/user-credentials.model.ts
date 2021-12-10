import {Entity, model, property} from '@loopback/repository';
import {generate} from '../utils';

@model()
export class UserCredentials extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    useDefaultIdType: false,
    default: () => generate(),
  })
  id: string;

  // TODO: スキーマを設定する
  @property({
    type: 'string',
    required: true,
  })
  password: string;

  @property({
    type: 'date',
    defaultFn: 'now',
  })
  updatedAt: string;

  @property({
    type: 'date',
    defaultFn: 'now',
  })
  createdAt: string;

  @property({
    type: 'string',
  })
  userId: string;

  [prop: string]: any;

  constructor(data?: Partial<UserCredentials>) {
    super(data);
  }
}

export interface UserCredentialsRelations {
  // describe navigational properties here
}

export type UserCredentialsWithRelations = UserCredentials & UserCredentialsRelations;
