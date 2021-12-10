import {Entity, model, property, belongsTo} from '@loopback/repository';
import {generate} from '../utils';
import {User} from './user.model';

@model()
export class UserProfile extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    useDefaultIdType: false,
    default: () => generate(),
  })
  id: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 2,
      maxLength: 20,
    },
  })
  realm: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      enum: ['male', 'female', 'other'],
    },
  })
  gender: string;

  @property({
    type: 'date',
    required: true,
    jsonSchema: {
      format: 'date-time',
    },
  })
  birth: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 1,
      maxLength: 50,
    },
  })
  belongTo: string;

  @property({
    type: 'string',
    jsonSchema: {
      minLength: 0,
      maxLength: 140,
    },
  })
  introduction?: string;

  @property({
    type: 'string',
    jsonSchema: {
      format: 'uri-reference',
    },
  })
  url?: string;

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

  @belongsTo(() => User)
  ownerId: string;

  [prop: string]: any;

  constructor(data?: Partial<UserProfile>) {
    super(data);
  }
}

export interface UserProfileRelations {
  // describe navigational properties here
}

export type UserProfileWithRelations = UserProfile & UserProfileRelations;
