import {
  model,
  property,
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  del,
  get,
  param,
  getModelSchemaRef,
  patch,
  requestBody,
  response,
  HttpErrors,
} from '@loopback/rest';
import {inject} from '@loopback/core';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {Project, SensorSetting, SpatiotemporalSetting, Member} from '../models';
import {ProjectRepository, MemberRepository} from '../repositories';
import {CasbinPolicyService} from '../services';

@model()
export class FullProject extends Project {
  @property({
    required: true,
  })
  sensorSetting: SensorSetting;

  @property({
    required: true,
  })
  spatiotemporalSetting: SpatiotemporalSetting;
}

@authenticate('jwt')
export class ProjectController {
  constructor(
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
    resource: '/projects',
    scopes: ['POST'],
  })
  @post('/projects')
  @response(200, {
    description: 'FullProject model instance',
    content: {'application/json': {schema: getModelSchemaRef(FullProject)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(FullProject, {
            title: 'NewFullProject',
            exclude: ['id', 'ownerId', 'projectId', 'updatedAt', 'createdAt'],
          }),
        },
      },
    })
    fullProject: Omit<FullProject, 'id'>,
  ): Promise<FullProject> {
    // Separate data
    const sensorSetting = fullProject.sensorSetting;
    const spatiotemporalSetting = fullProject.spatiotemporalSetting;
    delete (fullProject as Partial<FullProject>).sensorSetting;
    delete (fullProject as Partial<FullProject>).spatiotemporalSetting;
    // Add ownerId
    fullProject.ownerId = this.user[securityId];
    // Create project
    const savedProject = await this.projectRepository.create(fullProject);
    // Create sensorSetting
    const savedSensorSetting = await this.projectRepository
      .sensorSetting(savedProject.id)
      .create(sensorSetting);
    // Create spatiotemporalSetting
    const savedSpatiotemporalSetting = await this.projectRepository
      .spatiotemporalSetting(savedProject.id)
      .create(spatiotemporalSetting);
    // Create member
    await this.memberRepository.create({
      userId: this.user[securityId],
      projectId: savedProject.id,
    });
    // Add casbin policies
    await this.casbinPolicyService.addProjectPolicy(
      this.user[securityId],
      savedProject.id,
      savedSensorSetting.id,
      savedSpatiotemporalSetting.id,
    );
    // Make response
    savedProject.sensorSetting = savedSensorSetting;
    savedProject.spatiotemporalSetting = savedSpatiotemporalSetting;
    return savedProject;
  }

  @authorize({
    resource: '/projects/count',
    scopes: ['GET'],
  })
  @get('/projects/count')
  @response(200, {
    description: 'Project model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(@param.where(Project) where?: Where<Project>): Promise<Count> {
    return this.projectRepository.count(where);
  }

  @authorize({
    resource: '/projects',
    scopes: ['GET'],
  })
  @get('/projects')
  @response(200, {
    description: 'Array of FullProject model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(FullProject),
        },
      },
    },
  })
  async find(@param.filter(Project) filter?: Filter<Project>): Promise<FullProject[]> {
    const includeFilter = {
      include: [{relation: 'sensorSetting'}, {relation: 'spatiotemporalSetting'}],
    };
    return this.projectRepository.find({...filter, ...includeFilter});
  }

  @authorize({
    resource: '/projects/{id}',
    scopes: ['GET'],
  })
  @get('/projects/{id}')
  @response(200, {
    description: 'FullProject model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(FullProject, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Project, {exclude: 'where'})
    filter?: FilterExcludingWhere<Project>,
  ): Promise<FullProject> {
    const includeFilter = {
      include: [{relation: 'sensorSetting'}, {relation: 'spatiotemporalSetting'}],
    };
    return this.projectRepository.findById(id, {...filter, ...includeFilter});
  }

  @authorize({
    resource: '/projects/{id}',
    scopes: ['PATCH'],
  })
  @patch('/projects/{id}')
  @response(204, {
    description: 'Project PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Project, {
            partial: true,
            exclude: ['id', 'ownerId', 'updatedAt', 'createdAt'],
          }),
        },
      },
    })
    project: Project,
  ): Promise<void> {
    // Update updateAt
    project.updatedAt = new Date().toISOString();
    await this.projectRepository.updateById(id, project);
  }

  @authorize({
    resource: '/projects/{id}',
    scopes: ['DELETE'],
  })
  @del('/projects/{id}')
  @response(204, {
    description: 'Project DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    const includeFilter = {
      include: [
        {relation: 'sensorSetting'},
        {relation: 'spatiotemporalSetting'},
        {relation: 'sensingData'},
      ],
    };
    const project = await this.projectRepository.findById(id, includeFilter);
    await this.casbinPolicyService.removeProjectPolicy(
      project.ownerId,
      project.id,
      project.sensorSetting.id,
      project.spatiotemporalSetting.id,
    );
    // Remove casbin policy
    if (project.sensingData) {
      const sensingDataIds = project.sensingData.map(e => e.id);
      sensingDataIds.length > 0 &&
        (await this.casbinPolicyService.removeSensingDataPolicies(sensingDataIds));
    }
    await this.casbinPolicyService.savePolicy();
    // Remove data
    await this.memberRepository.deleteAll({projectId: id});
    await this.projectRepository.sensorSetting(id).delete();
    await this.projectRepository.spatiotemporalSetting(id).delete();
    await this.projectRepository.sensingData(id).delete();
    await this.projectRepository.deleteById(id);
  }

  @authorize({
    resource: '/projects/{id}/members',
    scopes: ['POST'],
  })
  @post('/projects/{id}/members')
  @response(200, {
    description: 'FullProject model instance',
  })
  async createMember(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Member, {
            exclude: ['id', 'projectId', 'updatedAt', 'createdAt'],
          }),
        },
      },
    })
    member: Member,
  ): Promise<Member> {
    member.projectId = id;
    // Add casbin policy
    await this.casbinPolicyService.addMemberForUser(member.id, id);
    return await this.memberRepository.create(member);
  }

  @authorize({
    resource: '/projects/{id}/members',
    scopes: ['DELETE'],
  })
  @del('/projects/{id}/members')
  @response(204, {
    description: 'Member DELETE success',
  })
  async deleteMemberById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Member, {
            exclude: ['id', 'projectId', 'updatedAt', 'createdAt'],
          }),
        },
      },
    })
    member: Member,
  ): Promise<void> {
    member.projectId = id;
    const currentMember = await this.memberRepository.findOne({
      where: {userId: member.userId, projectId: member.projectId},
    });
    if (!currentMember) throw new HttpErrors.NotFound();
    // Add casbin policy
    await this.casbinPolicyService.deleteMemberForUser(currentMember.userId, id);
    await this.casbinPolicyService.savePolicy();
    await this.memberRepository.deleteById(currentMember.id);
  }
}
