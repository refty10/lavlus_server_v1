import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  SensingData,
  User,
} from '../models';
import {SensingDataRepository} from '../repositories';

export class SensingDataUserController {
  constructor(
    @repository(SensingDataRepository)
    public sensingDataRepository: SensingDataRepository,
  ) { }

  @get('/sensing-data/{id}/user', {
    responses: {
      '200': {
        description: 'User belonging to SensingData',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(User)},
          },
        },
      },
    },
  })
  async getUser(
    @param.path.string('id') id: typeof SensingData.prototype.id,
  ): Promise<User> {
    return this.sensingDataRepository.owner(id);
  }
}
