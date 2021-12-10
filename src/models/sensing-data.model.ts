import {Entity, model, property, belongsTo} from '@loopback/repository';
import {generate} from '../utils';
import {User} from './user.model';
import {Project} from './project.model';

@model()
export class SensingData extends Entity {
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
    default: '',
  })
  originalname: string;

  @property({
    type: 'string',
    hidden: true,
    default: '',
  })
  path: string;

  @property({
    type: 'number',
    default: 0,
  })
  size: number;

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

  @belongsTo(() => Project)
  projectId: string;

  [prop: string]: any;

  constructor(data?: Partial<SensingData>) {
    super(data);
  }
}

export interface SensingDataRelations {
  // describe navigational properties here
}

export type SensingDataWithRelations = SensingData & SensingDataRelations;
