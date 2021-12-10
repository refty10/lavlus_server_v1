import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {param, get, getModelSchemaRef, patch, requestBody, response} from '@loopback/rest';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {SpatiotemporalSetting} from '../models';
import {SpatiotemporalSettingRepository} from '../repositories';

@authenticate('jwt')
export class SpatiotemporalSettingController {
  constructor(
    @repository(SpatiotemporalSettingRepository)
    public spatiotemporalSettingRepository: SpatiotemporalSettingRepository,
  ) {}

  @authorize({
    resource: '/spatiotemporal-settings/count',
    scopes: ['GET'],
  })
  @get('/spatiotemporal-settings/count')
  @response(200, {
    description: 'SpatiotemporalSetting model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(SpatiotemporalSetting) where?: Where<SpatiotemporalSetting>,
  ): Promise<Count> {
    return this.spatiotemporalSettingRepository.count(where);
  }

  @authorize({
    resource: '/spatiotemporal-settings',
    scopes: ['GET'],
  })
  @get('/spatiotemporal-settings')
  @response(200, {
    description: 'Array of SpatiotemporalSetting model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(SpatiotemporalSetting, {
            includeRelations: true,
          }),
        },
      },
    },
  })
  async find(
    @param.filter(SpatiotemporalSetting) filter?: Filter<SpatiotemporalSetting>,
  ): Promise<SpatiotemporalSetting[]> {
    return this.spatiotemporalSettingRepository.find(filter);
  }

  @authorize({
    resource: '/spatiotemporal-settings/{id}',
    scopes: ['GET'],
  })
  @get('/spatiotemporal-settings/{id}')
  @response(200, {
    description: 'SpatiotemporalSetting model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(SpatiotemporalSetting, {
          includeRelations: true,
        }),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(SpatiotemporalSetting, {exclude: 'where'})
    filter?: FilterExcludingWhere<SpatiotemporalSetting>,
  ): Promise<SpatiotemporalSetting> {
    return this.spatiotemporalSettingRepository.findById(id, filter);
  }

  @authorize({
    resource: '/spatiotemporal-settings/{id}',
    scopes: ['PATCH'],
  })
  @patch('/spatiotemporal-settings/{id}')
  @response(204, {
    description: 'SpatiotemporalSetting PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(SpatiotemporalSetting, {
            partial: true,
            exclude: ['id', 'projectId', 'updatedAt', 'createdAt'],
          }),
        },
      },
    })
    spatiotemporalSetting: SpatiotemporalSetting,
  ): Promise<void> {
    // Update updateAt
    spatiotemporalSetting.updatedAt = new Date().toISOString();
    await this.spatiotemporalSettingRepository.updateById(id, spatiotemporalSetting);
  }
}
