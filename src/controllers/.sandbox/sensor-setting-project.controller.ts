import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  SensorSetting,
  Project,
} from '../models';
import {SensorSettingRepository} from '../repositories';

export class SensorSettingProjectController {
  constructor(
    @repository(SensorSettingRepository)
    public sensorSettingRepository: SensorSettingRepository,
  ) { }

  @get('/sensor-settings/{id}/project', {
    responses: {
      '200': {
        description: 'Project belonging to SensorSetting',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Project)},
          },
        },
      },
    },
  })
  async getProject(
    @param.path.string('id') id: typeof SensorSetting.prototype.id,
  ): Promise<Project> {
    return this.sensorSettingRepository.project(id);
  }
}
