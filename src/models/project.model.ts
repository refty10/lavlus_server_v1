import {Entity, model, property, belongsTo, hasOne, hasMany} from '@loopback/repository';
import {generate} from '../utils';
import {User} from './user.model';
import {SensorSetting} from './sensor-setting.model';
import {SpatiotemporalSetting} from './spatiotemporal-setting.model';
import {SensingData} from './sensing-data.model';
import {Member} from './member.model';

@model()
export class Project extends Entity {
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
      minLength: 4,
      maxLength: 30,
    },
  })
  name: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 10,
      maxLength: 2000,
    },
  })
  overview: string;

  @property({
    type: 'date',
    required: true,
    jsonSchema: {
      format: 'date-time',
    },
  })
  startDate: string;

  @property({
    type: 'date',
    required: true,
    jsonSchema: {
      format: 'date-time',
    },
  })
  endDate: string;

  @property({
    type: 'string',
    jsonSchema: {
      format: 'uri-reference',
    },
  })
  image?: string;

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

  @hasOne(() => SensorSetting)
  sensorSetting: SensorSetting;

  @hasOne(() => SpatiotemporalSetting)
  spatiotemporalSetting: SpatiotemporalSetting;

  @hasMany(() => SensingData)
  sensingData: SensingData[];

  @hasMany(() => User, {through: {model: () => Member}})
  users: User[];

  [prop: string]: any;

  constructor(data?: Partial<Project>) {
    super(data);
  }
}

export interface ProjectRelations {
  // describe navigational properties here
}

export type ProjectWithRelations = Project & ProjectRelations;
