import {Entity, model, property, hasOne, hasMany} from '@loopback/repository';
import {generate} from '../utils';
import {UserCredentials} from './user-credentials.model';
import {Project} from './project.model';
import {UserProfile} from './user-profile.model';
import {SensingData} from './sensing-data.model';
import {Member} from './member.model';

@model()
export class User extends Entity {
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
      format: 'email',
    },
  })
  email: string;

  @property({
    type: 'string',
    jsonSchema: {
      minLength: 4,
      maxLength: 20,
    },
  })
  username?: string;

  @property({
    type: 'string',
    jsonSchema: {
      format: 'uri-reference',
    },
  })
  image?: string;

  @property({
    type: 'array',
    itemType: 'string',
    default: [],
  })
  roles: string[];

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

  @hasOne(() => UserCredentials)
  userCredentials: UserCredentials;

  @hasMany(() => Project, {keyTo: 'ownerId'})
  ownProjects: Project[];

  @hasOne(() => UserProfile, {keyTo: 'ownerId'})
  userProfile: UserProfile;

  @hasMany(() => SensingData, {keyTo: 'ownerId'})
  sensingData: SensingData[];

  @hasMany(() => Project, {through: {model: () => Member}})
  projects: Project[];

  [prop: string]: any;

  constructor(data?: Partial<User>) {
    super(data);
  }
}

export interface UserRelations {
  // describe navigational properties here
}

export type UserWithRelations = User & UserRelations;
