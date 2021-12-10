import {Entity, model, property} from '@loopback/repository';
import {generate} from '../utils';

@model()
export class Member extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    useDefaultIdType: false,
    default: () => generate(),
  })
  id: string;

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
    required: true,
  })
  userId: string;

  @property({
    type: 'string',
  })
  projectId: string;

  constructor(data?: Partial<Member>) {
    super(data);
  }
}

export interface MemberRelations {
  // describe navigational properties here
}

export type MemberWithRelations = Member & MemberRelations;
