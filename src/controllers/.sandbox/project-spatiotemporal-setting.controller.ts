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
  SpatiotemporalSetting,
} from '../models';
import {ProjectRepository} from '../repositories';

export class ProjectSpatiotemporalSettingController {
  constructor(
    @repository(ProjectRepository) protected projectRepository: ProjectRepository,
  ) { }

  @get('/projects/{id}/spatiotemporal-setting', {
    responses: {
      '200': {
        description: 'Project has one SpatiotemporalSetting',
        content: {
          'application/json': {
            schema: getModelSchemaRef(SpatiotemporalSetting),
          },
        },
      },
    },
  })
  async get(
    @param.path.string('id') id: string,
    @param.query.object('filter') filter?: Filter<SpatiotemporalSetting>,
  ): Promise<SpatiotemporalSetting> {
    return this.projectRepository.spatiotemporalSetting(id).get(filter);
  }

  @post('/projects/{id}/spatiotemporal-setting', {
    responses: {
      '200': {
        description: 'Project model instance',
        content: {'application/json': {schema: getModelSchemaRef(SpatiotemporalSetting)}},
      },
    },
  })
  async create(
    @param.path.string('id') id: typeof Project.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(SpatiotemporalSetting, {
            title: 'NewSpatiotemporalSettingInProject',
            exclude: ['id'],
            optional: ['projectId']
          }),
        },
      },
    }) spatiotemporalSetting: Omit<SpatiotemporalSetting, 'id'>,
  ): Promise<SpatiotemporalSetting> {
    return this.projectRepository.spatiotemporalSetting(id).create(spatiotemporalSetting);
  }

  @patch('/projects/{id}/spatiotemporal-setting', {
    responses: {
      '200': {
        description: 'Project.SpatiotemporalSetting PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(SpatiotemporalSetting, {partial: true}),
        },
      },
    })
    spatiotemporalSetting: Partial<SpatiotemporalSetting>,
    @param.query.object('where', getWhereSchemaFor(SpatiotemporalSetting)) where?: Where<SpatiotemporalSetting>,
  ): Promise<Count> {
    return this.projectRepository.spatiotemporalSetting(id).patch(spatiotemporalSetting, where);
  }

  @del('/projects/{id}/spatiotemporal-setting', {
    responses: {
      '200': {
        description: 'Project.SpatiotemporalSetting DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.string('id') id: string,
    @param.query.object('where', getWhereSchemaFor(SpatiotemporalSetting)) where?: Where<SpatiotemporalSetting>,
  ): Promise<Count> {
    return this.projectRepository.spatiotemporalSetting(id).delete(where);
  }
}
