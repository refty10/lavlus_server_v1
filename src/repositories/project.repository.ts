import {inject, Getter} from '@loopback/core';
import {
  DefaultCrudRepository,
  repository,
  BelongsToAccessor,
  HasOneRepositoryFactory,
  HasManyRepositoryFactory,
  HasManyThroughRepositoryFactory,
} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {
  Project,
  ProjectRelations,
  User,
  SensorSetting,
  SpatiotemporalSetting,
  SensingData,
  Member,
} from '../models';
import {UserRepository} from './user.repository';
import {SensorSettingRepository} from './sensor-setting.repository';
import {SpatiotemporalSettingRepository} from './spatiotemporal-setting.repository';
import {SensingDataRepository} from './sensing-data.repository';
import {MemberRepository} from './member.repository';

export class ProjectRepository extends DefaultCrudRepository<
  Project,
  typeof Project.prototype.id,
  ProjectRelations
> {
  public readonly owner: BelongsToAccessor<User, typeof Project.prototype.id>;

  public readonly sensorSetting: HasOneRepositoryFactory<
    SensorSetting,
    typeof Project.prototype.id
  >;

  public readonly spatiotemporalSetting: HasOneRepositoryFactory<
    SpatiotemporalSetting,
    typeof Project.prototype.id
  >;

  public readonly sensingData: HasManyRepositoryFactory<SensingData, typeof Project.prototype.id>;

  public readonly users: HasManyThroughRepositoryFactory<
    User,
    typeof User.prototype.id,
    Member,
    typeof Project.prototype.id
  >;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @repository.getter('UserRepository')
    protected userRepositoryGetter: Getter<UserRepository>,
    @repository.getter('SensorSettingRepository')
    protected sensorSettingRepositoryGetter: Getter<SensorSettingRepository>,
    @repository.getter('SpatiotemporalSettingRepository')
    protected spatiotemporalSettingRepositoryGetter: Getter<SpatiotemporalSettingRepository>,
    @repository.getter('SensingDataRepository')
    protected sensingDataRepositoryGetter: Getter<SensingDataRepository>,
    @repository.getter('MemberRepository')
    protected memberRepositoryGetter: Getter<MemberRepository>,
  ) {
    super(Project, dataSource);
    this.users = this.createHasManyThroughRepositoryFactoryFor(
      'users',
      userRepositoryGetter,
      memberRepositoryGetter,
    );
    this.registerInclusionResolver('users', this.users.inclusionResolver);
    this.sensingData = this.createHasManyRepositoryFactoryFor(
      'sensingData',
      sensingDataRepositoryGetter,
    );
    this.registerInclusionResolver('sensingData', this.sensingData.inclusionResolver);
    this.spatiotemporalSetting = this.createHasOneRepositoryFactoryFor(
      'spatiotemporalSetting',
      spatiotemporalSettingRepositoryGetter,
    );
    this.registerInclusionResolver(
      'spatiotemporalSetting',
      this.spatiotemporalSetting.inclusionResolver,
    );
    this.sensorSetting = this.createHasOneRepositoryFactoryFor(
      'sensorSetting',
      sensorSettingRepositoryGetter,
    );
    this.registerInclusionResolver('sensorSetting', this.sensorSetting.inclusionResolver);
    this.owner = this.createBelongsToAccessorFor('owner', userRepositoryGetter);
    this.registerInclusionResolver('owner', this.owner.inclusionResolver);
  }
}
