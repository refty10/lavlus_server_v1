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
  Project,
} from '../models';
import {SensingDataRepository} from '../repositories';

export class SensingDataProjectController {
  constructor(
    @repository(SensingDataRepository)
    public sensingDataRepository: SensingDataRepository,
  ) { }

  @get('/sensing-data/{id}/project', {
    responses: {
      '200': {
        description: 'Project belonging to SensingData',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Project)},
          },
        },
      },
    },
  })
  async getProject(
    @param.path.string('id') id: typeof SensingData.prototype.id,
  ): Promise<Project> {
    return this.sensingDataRepository.project(id);
  }
}
