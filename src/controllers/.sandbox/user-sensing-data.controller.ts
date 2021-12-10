import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  getWhereSchemaFor,
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import {
  User,
  SensingData,
} from '../models';
import {UserRepository} from '../repositories';

export class UserSensingDataController {
  constructor(
    @repository(UserRepository) protected userRepository: UserRepository,
  ) { }

  @get('/users/{id}/sensing-data', {
    responses: {
      '200': {
        description: 'Array of User has many SensingData',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(SensingData)},
          },
        },
      },
    },
  })
  async find(
    @param.path.string('id') id: string,
    @param.query.object('filter') filter?: Filter<SensingData>,
  ): Promise<SensingData[]> {
    return this.userRepository.sensingData(id).find(filter);
  }

  @post('/users/{id}/sensing-data', {
    responses: {
      '200': {
        description: 'User model instance',
        content: {'application/json': {schema: getModelSchemaRef(SensingData)}},
      },
    },
  })
  async create(
    @param.path.string('id') id: typeof User.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(SensingData, {
            title: 'NewSensingDataInUser',
            exclude: ['id'],
            optional: ['ownerId']
          }),
        },
      },
    }) sensingData: Omit<SensingData, 'id'>,
  ): Promise<SensingData> {
    return this.userRepository.sensingData(id).create(sensingData);
  }

  @patch('/users/{id}/sensing-data', {
    responses: {
      '200': {
        description: 'User.SensingData PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(SensingData, {partial: true}),
        },
      },
    })
    sensingData: Partial<SensingData>,
    @param.query.object('where', getWhereSchemaFor(SensingData)) where?: Where<SensingData>,
  ): Promise<Count> {
    return this.userRepository.sensingData(id).patch(sensingData, where);
  }

  @del('/users/{id}/sensing-data', {
    responses: {
      '200': {
        description: 'User.SensingData DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.string('id') id: string,
    @param.query.object('where', getWhereSchemaFor(SensingData)) where?: Where<SensingData>,
  ): Promise<Count> {
    return this.userRepository.sensingData(id).delete(where);
  }
}
