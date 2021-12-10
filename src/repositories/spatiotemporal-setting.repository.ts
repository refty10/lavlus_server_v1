import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {SpatiotemporalSetting, SpatiotemporalSettingRelations, Project} from '../models';
import {ProjectRepository} from './project.repository';

export class SpatiotemporalSettingRepository extends DefaultCrudRepository<
  SpatiotemporalSetting,
  typeof SpatiotemporalSetting.prototype.id,
  SpatiotemporalSettingRelations
> {
  public readonly project: BelongsToAccessor<Project, typeof SpatiotemporalSetting.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @repository.getter('ProjectRepository')
    protected projectRepositoryGetter: Getter<ProjectRepository>,
  ) {
    super(SpatiotemporalSetting, dataSource);
    this.project = this.createBelongsToAccessorFor('project', projectRepositoryGetter);
    this.registerInclusionResolver('project', this.project.inclusionResolver);
  }
}
