import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {SensingData, SensingDataRelations, User, Project} from '../models';
import {UserRepository} from './user.repository';
import {ProjectRepository} from './project.repository';

export class SensingDataRepository extends DefaultCrudRepository<
  SensingData,
  typeof SensingData.prototype.id,
  SensingDataRelations
> {
  public readonly owner: BelongsToAccessor<User, typeof SensingData.prototype.id>;

  public readonly project: BelongsToAccessor<Project, typeof SensingData.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>,
    @repository.getter('ProjectRepository')
    protected projectRepositoryGetter: Getter<ProjectRepository>,
  ) {
    super(SensingData, dataSource);
    this.project = this.createBelongsToAccessorFor('project', projectRepositoryGetter);
    this.registerInclusionResolver('project', this.project.inclusionResolver);
    this.owner = this.createBelongsToAccessorFor('owner', userRepositoryGetter);
    this.registerInclusionResolver('owner', this.owner.inclusionResolver);
  }
}
