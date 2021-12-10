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
import {SensorSetting} from '../models';
import {SensorSettingRepository} from '../repositories';

@authenticate('jwt')
export class SensorSettingController {
  constructor(
    @repository(SensorSettingRepository)
    public sensorSettingRepository: SensorSettingRepository,
  ) {}

  @authorize({
    resource: '/sensor-settings/count',
    scopes: ['GET'],
  })
  @get('/sensor-settings/count')
  @response(200, {
    description: 'SensorSetting model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(@param.where(SensorSetting) where?: Where<SensorSetting>): Promise<Count> {
    return this.sensorSettingRepository.count(where);
  }

  @authorize({
    resource: '/sensor-settings',
    scopes: ['GET'],
  })
  @get('/sensor-settings')
  @response(200, {
    description: 'Array of SensorSetting model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(SensorSetting, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(SensorSetting) filter?: Filter<SensorSetting>,
  ): Promise<SensorSetting[]> {
    return this.sensorSettingRepository.find(filter);
  }

  @authorize({
    resource: '/sensor-settings/{id}',
    scopes: ['GET'],
  })
  @get('/sensor-settings/{id}')
  @response(200, {
    description: 'SensorSetting model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(SensorSetting, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(SensorSetting, {exclude: 'where'})
    filter?: FilterExcludingWhere<SensorSetting>,
  ): Promise<SensorSetting> {
    return this.sensorSettingRepository.findById(id, filter);
  }

  @authorize({
    resource: '/sensor-settings/{id}',
    scopes: ['PATCH'],
  })
  @patch('/sensor-settings/{id}')
  @response(204, {
    description: 'SensorSetting PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(SensorSetting, {
            partial: true,
            exclude: ['id', 'projectId', 'updatedAt', 'createdAt'],
          }),
        },
      },
    })
    sensorSetting: SensorSetting,
  ): Promise<void> {
    // Update updateAt
    sensorSetting.updatedAt = new Date().toISOString();
    await this.sensorSettingRepository.updateById(id, sensorSetting);
  }
}
