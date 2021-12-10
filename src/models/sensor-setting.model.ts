import {Entity, model, property, belongsTo} from '@loopback/repository';
import {generate} from '../utils';
import {Project} from './project.model';

@model()
export class SensorSetting extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    useDefaultIdType: false,
    default: () => generate(),
  })
  id: string;

  @property({
    type: 'boolean',
    default: false,
  })
  isProvidedProfile: boolean;

  @property({
    type: 'object',
    required: true,
  })
  sensors: object;

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

  @belongsTo(() => Project)
  projectId: string;

  [prop: string]: any;

  constructor(data?: Partial<SensorSetting>) {
    super(data);
  }
}

export interface SensorSettingRelations {
  // describe navigational properties here
}

export type SensorSettingWithRelations = SensorSetting & SensorSettingRelations;