import {Count, CountSchema, Filter, repository} from '@loopback/repository';
import {
  param,
  get,
  del,
  patch,
  response,
  requestBody,
  getModelSchemaRef,
  SchemaObject,
  HttpErrors,
} from '@loopback/rest';
import {inject} from '@loopback/core';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {User, SensingData, Project, UserProfile as MyUserProfile} from '../models';
import {
  UserRepository,
  UserProfileRepository,
  ProjectRepository,
  MemberRepository,
} from '../repositories';
import {CasbinPolicyService} from '../services';

@authenticate('jwt')
export class UserMeController {
  constructor(
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(UserProfileRepository)
    public userProfileRepository: UserProfileRepository,
    @repository(ProjectRepository)
    public projectRepository: ProjectRepository,
    @repository(MemberRepository)
    public memberRepository: MemberRepository,
    @inject(SecurityBindings.USER, {optional: true})
    private user: UserProfile,
    @inject('services.CasbinPolicy')
    public casbinPolicyService: CasbinPolicyService,
  ) {}

  @authorize({
    resource: '/users/me',
    scopes: ['GET'],
  })
  @get('/users/me', {
    responses: {
      '200': {
        description: '',
        schema: {
          type: 'string',
        },
      },
    },
  })
  async whoAmI(): Promise<User> {
    if (this.user.roles.includes('requester')) {
      const filter = {include: [{relation: 'userProfile'}]};
      return await this.userRepository.findById(this.user[securityId], filter);
    }
    return await this.userRepository.findById(this.user[securityId]);
  }

  @authorize({
    resource: '/users/me',
    scopes: ['PATCH'],
  })
  @patch('/users/me')
  @response(204, {
    description: 'User PATCH success',
  })
  async updateUserById(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {
            partial: true,
            exclude: ['id', 'roles', 'updatedAt', 'createdAt'],
          }),
        },
      },
    })
    user: User,
  ): Promise<void> {
    // Update updateAt
    user.updatedAt = new Date().toISOString();
    await this.userRepository.updateById(this.user[securityId], user);
  }

  @authorize({
    resource: '/users/me',
    scopes: ['DELETE'],
  })
  @del('/users/me')
  @response(204, {
    description: 'User DELETE success',
  })
  async delete(): Promise<void> {
    if (this.user.roles.includes('requester')) {
      const includeFilter = {
        include: [
          {relation: 'sensorSetting'},
          {relation: 'spatiotemporalSetting'},
          {relation: 'sensingData'},
        ],
      };
      const projects = await this.userRepository
        .ownProjects(this.user[securityId])
        .find(includeFilter);
      if (projects.length > 0) {
        for (const project of projects) {
          const sensingDataIds = project.sensingData.map(data => data.id);
          // remove sensingData policies
          sensingDataIds.length > 0 &&
            (await this.casbinPolicyService.removeSensingDataPolicies(sensingDataIds));
          // remove member policies
          await this.casbinPolicyService.deleteMember(project.id);
          // delete objects related to the project
          await this.memberRepository.deleteAll({projectId: project.id});
          await this.projectRepository.sensorSetting(project.id).delete();
          await this.projectRepository.spatiotemporalSetting(project.id).delete();
          await this.projectRepository.sensingData(project.id).delete();
          await this.projectRepository.deleteById(project.id);
        }
      }
      await this.memberRepository.deleteAll({userId: this.user[securityId]});
      await this.userRepository.userProfile(this.user[securityId]).delete();
    }
    // remove policies related to user
    await this.casbinPolicyService.deleteUser(this.user[securityId]);
    await this.casbinPolicyService.savePolicy();
    await this.userRepository.userCredentials(this.user[securityId]).delete();
    await this.userRepository.deleteById(this.user[securityId]);
  }

  @authorize({
    resource: '/users/me/sensing-data',
    scopes: ['GET'],
  })
  @get('/users/me/sensing-data', {
    responses: {
      '200': {
        description: 'Array of User has many SensingData',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(SensingData)},
          },
        },
      },
    },
  })
  async findSensingData(
    @param.query.object('filter') filter?: Filter<SensingData>,
  ): Promise<SensingData[]> {
    return this.userRepository.sensingData(this.user[securityId]).find(filter);
  }

  @authorize({
    resource: '/users/me/sensing-data',
    scopes: ['DELETE'],
  })
  @del('/users/me/sensing-data', {
    responses: {
      '200': {
        description: 'User.SensingData DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async deleteSensingData(): Promise<Count> {
    // Apply include filter
    const filter = {include: [{relation: 'project'}]};
    const sensingData = await this.userRepository.sensingData(this.user[securityId]).find(filter);
    // Remove casbin policies
    const sensingDataIds = sensingData.map(e => e.id);
    await this.casbinPolicyService.removeSensingDataPolicies(sensingDataIds);
    await this.casbinPolicyService.savePolicy();
    return this.userRepository.sensingData(this.user[securityId]).delete();
  }

  @authorize({
    resource: '/user/me/user-profile',
    scopes: ['PATCH'],
  })
  @patch('/user/me/user-profile')
  @response(204, {
    description: 'UserProfile PATCH success',
  })
  async updateUserProfileById(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(MyUserProfile, {
            partial: true,
            exclude: ['id', 'updatedAt', 'createdAt'],
          }),
        },
      },
    })
    userProfile: MyUserProfile,
  ): Promise<void> {
    // Find user profile
    const filter = {where: {ownerId: this.user[securityId]}};
    const currentUserProfile = await this.userProfileRepository.findOne(filter);
    // Error handling
    if (!currentUserProfile) throw new HttpErrors.NotFound('User profile is not found.');
    // Update updateAt
    userProfile.updatedAt = new Date().toISOString();
    await this.userProfileRepository.updateById(currentUserProfile.id, userProfile);
  }

  @authorize({
    resource: '/users/me/projects',
    scopes: ['GET'],
  })
  @get('/users/me/projects', {
    responses: {
      '200': {
        description: 'Array of User has many Project',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Project)},
          },
        },
      },
    },
  })
  async findProjects(@param.query.object('filter') filter?: Filter<Project>): Promise<Project[]> {
    return this.userRepository.projects(this.user[securityId]).find(filter);
  }
}
