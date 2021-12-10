import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  SpatiotemporalSetting,
  Project,
} from '../models';
import {SpatiotemporalSettingRepository} from '../repositories';

export class SpatiotemporalSettingProjectController {
  constructor(
    @repository(SpatiotemporalSettingRepository)
    public spatiotemporalSettingRepository: SpatiotemporalSettingRepository,
  ) { }

  @get('/spatiotemporal-settings/{id}/project', {
    responses: {
      '200': {
        description: 'Project belonging to SpatiotemporalSetting',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Project)},
          },
        },
      },
    },
  })
  async getProject(
    @param.path.string('id') id: typeof SpatiotemporalSetting.prototype.id,
  ): Promise<Project> {
    return this.spatiotemporalSettingRepository.project(id);
  }
}
