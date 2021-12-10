import {Count, CountSchema, Filter, repository, Where} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  getWhereSchemaFor,
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import {Project, Member, User} from '../models';
import {ProjectRepository} from '../repositories';

export class ProjectUserController {
  constructor(@repository(ProjectRepository) protected projectRepository: ProjectRepository) {}

  @get('/projects/{id}/users', {
    responses: {
      '200': {
        description: 'Array of Project has many User through Member',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(User)},
          },
        },
      },
    },
  })
  async find(
    @param.path.string('id') id: string,
    @param.query.object('filter') filter?: Filter<User>,
  ): Promise<User[]> {
    return this.projectRepository.users(id).find(filter);
  }

  @post('/projects/{id}/users', {
    responses: {
      '200': {
        description: 'create a User model instance',
        content: {'application/json': {schema: getModelSchemaRef(User)}},
      },
    },
  })
  async create(
    @param.path.string('id') id: typeof Project.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {
            title: 'NewUserInProject',
            exclude: ['id'],
          }),
        },
      },
    })
    user: Omit<User, 'id'>,
  ): Promise<User> {
    return this.projectRepository.users(id).create(user);
  }

  @patch('/projects/{id}/users', {
    responses: {
      '200': {
        description: 'Project.User PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {partial: true}),
        },
      },
    })
    user: Partial<User>,
    @param.query.object('where', getWhereSchemaFor(User)) where?: Where<User>,
  ): Promise<Count> {
    return this.projectRepository.users(id).patch(user, where);
  }

  @del('/projects/{id}/users', {
    responses: {
      '200': {
        description: 'Project.User DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.string('id') id: string,
    @param.query.object('where', getWhereSchemaFor(User)) where?: Where<User>,
  ): Promise<Count> {
    return this.projectRepository.users(id).delete(where);
  }
}
