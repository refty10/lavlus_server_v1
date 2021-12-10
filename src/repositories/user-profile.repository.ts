import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {UserProfile, UserProfileRelations, User} from '../models';
import {UserRepository} from './user.repository';

export class UserProfileRepository extends DefaultCrudRepository<
  UserProfile,
  typeof UserProfile.prototype.id,
  UserProfileRelations
> {
  public readonly owner: BelongsToAccessor<User, typeof UserProfile.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>,
  ) {
    super(UserProfile, dataSource);
    this.owner = this.createBelongsToAccessorFor('owner', userRepositoryGetter);
    this.registerInclusionResolver('owner', this.owner.inclusionResolver);
  }
}
