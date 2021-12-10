import {inject, Getter} from '@loopback/core';
import {
  DefaultCrudRepository,
  repository,
  HasOneRepositoryFactory,
  HasManyRepositoryFactory,
  HasManyThroughRepositoryFactory,
} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {
  User,
  UserRelations,
  UserCredentials,
  Project,
  UserProfile,
  SensingData,
  Member,
} from '../models';
import {UserCredentialsRepository} from './user-credentials.repository';
import {ProjectRepository} from './project.repository';
import {UserProfileRepository} from './user-profile.repository';
import {SensingDataRepository} from './sensing-data.repository';
import {MemberRepository} from './member.repository';

export class UserRepository extends DefaultCrudRepository<
  User,
  typeof User.prototype.id,
  UserRelations
> {
  public readonly userCredentials: HasOneRepositoryFactory<
    UserCredentials,
    typeof User.prototype.id
  >;

  public readonly ownProjects: HasManyRepositoryFactory<Project, typeof User.prototype.id>;

  public readonly userProfile: HasOneRepositoryFactory<UserProfile, typeof User.prototype.id>;

  public readonly sensingData: HasManyRepositoryFactory<SensingData, typeof User.prototype.id>;

  public readonly projects: HasManyThroughRepositoryFactory<
    Project,
    typeof Project.prototype.id,
    Member,
    typeof User.prototype.id
  >;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @repository.getter('UserCredentialsRepository')
    protected userCredentialsRepositoryGetter: Getter<UserCredentialsRepository>,
    @repository.getter('ProjectRepository')
    protected projectRepositoryGetter: Getter<ProjectRepository>,
    @repository.getter('UserProfileRepository')
    protected userProfileRepositoryGetter: Getter<UserProfileRepository>,
    @repository.getter('SensingDataRepository')
    protected sensingDataRepositoryGetter: Getter<SensingDataRepository>,
    @repository.getter('MemberRepository')
    protected memberRepositoryGetter: Getter<MemberRepository>,
  ) {
    super(User, dataSource);
    this.projects = this.createHasManyThroughRepositoryFactoryFor(
      'projects',
      projectRepositoryGetter,
      memberRepositoryGetter,
    );
    this.registerInclusionResolver('projects', this.projects.inclusionResolver);
    this.sensingData = this.createHasManyRepositoryFactoryFor(
      'sensingData',
      sensingDataRepositoryGetter,
    );
    this.registerInclusionResolver('sensingData', this.sensingData.inclusionResolver);
    this.userProfile = this.createHasOneRepositoryFactoryFor(
      'userProfile',
      userProfileRepositoryGetter,
    );
    this.registerInclusionResolver('userProfile', this.userProfile.inclusionResolver);
    this.ownProjects = this.createHasManyRepositoryFactoryFor(
      'ownProjects',
      projectRepositoryGetter,
    );
    this.registerInclusionResolver('ownProjects', this.ownProjects.inclusionResolver);
    this.userCredentials = this.createHasOneRepositoryFactoryFor(
      'userCredentials',
      userCredentialsRepositoryGetter,
    );
  }

  async findCredentials(userId: typeof User.prototype.id): Promise<UserCredentials | undefined> {
    try {
      return await this.userCredentials(userId).get();
    } catch (err) {
      if (err.code === 'ENTITY_NOT_FOUND') {
        return undefined;
      }
      throw err;
    }
  }
}
