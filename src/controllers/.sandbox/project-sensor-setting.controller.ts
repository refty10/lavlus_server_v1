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
  Project,
  SensorSetting,
} from '../models';
import {ProjectRepository} from '../repositories';

export class ProjectSensorSettingController {
  constructor(
    @repository(ProjectRepository) protected projectRepository: ProjectRepository,
  ) { }

  @get('/projects/{id}/sensor-setting', {
    responses: {
      '200': {
        description: 'Project has one SensorSetting',
        content: {
          'application/json': {
            schema: getModelSchemaRef(SensorSetting),
          },
        },
      },
    },
  })
  async get(
    @param.path.string('id') id: string,
    @param.query.object('filter') filter?: Filter<SensorSetting>,
  ): Promise<SensorSetting> {
    return this.projectRepository.sensorSetting(id).get(filter);
  }

  @post('/projects/{id}/sensor-setting', {
    responses: {
      '200': {
        description: 'Project model instance',
        content: {'application/json': {schema: getModelSchemaRef(SensorSetting)}},
      },
    },
  })
  async create(
    @param.path.string('id') id: typeof Project.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(SensorSetting, {
            title: 'NewSensorSettingInProject',
            exclude: ['id'],
            optional: ['projectId']
          }),
        },
      },
    }) sensorSetting: Omit<SensorSetting, 'id'>,
  ): Promise<SensorSetting> {
    return this.projectRepository.sensorSetting(id).create(sensorSetting);
  }

  @patch('/projects/{id}/sensor-setting', {
    responses: {
      '200': {
        description: 'Project.SensorSetting PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(SensorSetting, {partial: true}),
        },
      },
    })
    sensorSetting: Partial<SensorSetting>,
    @param.query.object('where', getWhereSchemaFor(SensorSetting)) where?: Where<SensorSetting>,
  ): Promise<Count> {
    return this.projectRepository.sensorSetting(id).patch(sensorSetting, where);
  }

  @del('/projects/{id}/sensor-setting', {
    responses: {
      '200': {
        description: 'Project.SensorSetting DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.string('id') id: string,
    @param.query.object('where', getWhereSchemaFor(SensorSetting)) where?: Where<SensorSetting>,
  ): Promise<Count> {
    return this.projectRepository.sensorSetting(id).delete(where);
  }
}
