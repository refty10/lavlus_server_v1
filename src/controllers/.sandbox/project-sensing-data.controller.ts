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
  SensingData,
} from '../models';
import {ProjectRepository} from '../repositories';

export class ProjectSensingDataController {
  constructor(
    @repository(ProjectRepository) protected projectRepository: ProjectRepository,
  ) { }

  @get('/projects/{id}/sensing-data', {
    responses: {
      '200': {
        description: 'Array of Project has many SensingData',
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
    return this.projectRepository.sensingData(id).find(filter);
  }

  @post('/projects/{id}/sensing-data', {
    responses: {
      '200': {
        description: 'Project model instance',
        content: {'application/json': {schema: getModelSchemaRef(SensingData)}},
      },
    },
  })
  async create(
    @param.path.string('id') id: typeof Project.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(SensingData, {
            title: 'NewSensingDataInProject',
            exclude: ['id'],
            optional: ['projectId']
          }),
        },
      },
    }) sensingData: Omit<SensingData, 'id'>,
  ): Promise<SensingData> {
    return this.projectRepository.sensingData(id).create(sensingData);
  }

  @patch('/projects/{id}/sensing-data', {
    responses: {
      '200': {
        description: 'Project.SensingData PATCH success count',
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
    return this.projectRepository.sensingData(id).patch(sensingData, where);
  }

  @del('/projects/{id}/sensing-data', {
    responses: {
      '200': {
        description: 'Project.SensingData DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.string('id') id: string,
    @param.query.object('where', getWhereSchemaFor(SensingData)) where?: Where<SensingData>,
  ): Promise<Count> {
    return this.projectRepository.sensingData(id).delete(where);
  }
}
