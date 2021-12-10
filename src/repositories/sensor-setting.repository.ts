import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {SensorSetting, SensorSettingRelations, Project} from '../models';
import {ProjectRepository} from './project.repository';

export class SensorSettingRepository extends DefaultCrudRepository<
  SensorSetting,
  typeof SensorSetting.prototype.id,
  SensorSettingRelations
> {
  public readonly project: BelongsToAccessor<Project, typeof SensorSetting.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @repository.getter('ProjectRepository')
    protected projectRepositoryGetter: Getter<ProjectRepository>,
  ) {
    super(SensorSetting, dataSource);
    this.project = this.createBelongsToAccessorFor('project', projectRepositoryGetter);
    this.registerInclusionResolver('project', this.project.inclusionResolver);
  }
}
