import {Entity, model, property, belongsTo} from '@loopback/repository';
import {generate} from '../utils';
import {Project} from './project.model';

@model()
export class Period extends Entity {
  @property({
    type: 'object',
    required: true,
    jsonSchema: {
      required: ['length', 'entity'],
      properties: {
        length: {
          type: 'number',
          minLength: 1,
        },
        entity: {
          type: 'string',
          enum: ['day', 'week'],
        },
        dayOfWeek: {
          type: 'array',
          minItems: 1,
          maxItems: 7,
          items: {
            type: 'string',
            enum: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
          },
        },
      },
    },
  })
  interval: object;

  @property({
    type: 'object',
    required: true,
    jsonSchema: {
      required: ['from', 'to'],
      properties: {
        from: {
          type: 'string',
          format: 'time',
        },
        to: {
          type: 'string',
          format: 'time',
        },
      },
    },
  })
  period: object;
}

@model()
export class Location extends Entity {
  @property({
    type: 'number',
    required: true,
  })
  latitude: number;

  @property({
    type: 'number',
    required: true,
  })
  longitude: number;
}

@model()
export class SpatiotemporalSetting extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    useDefaultIdType: false,
    default: () => generate(),
  })
  id: string;

  @property({
    type: 'object',
    required: true,
  })
  location: Location;

  // TODO: スキーマを設定する
  @property({
    type: 'object',
    required: true,
  })
  area: object;

  @property.array(Period, {
    required: true,
  })
  periods: Period[];

  @property({
    type: 'date',
    defaultFn: 'now',
  })
  updatedAt: string;

  @belongsTo(() => Project)
  projectId: string;
  @property({
    type: 'date',
    defaultFn: 'now',
  })
  createdAt: string;

  [prop: string]: any;

  constructor(data?: Partial<SpatiotemporalSetting>) {
    super(data);
  }
}

export interface SpatiotemporalSettingRelations {
  // describe navigational properties here
}

export type SpatiotemporalSettingWithRelations = SpatiotemporalSetting &
  SpatiotemporalSettingRelations;
