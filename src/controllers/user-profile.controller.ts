import {Count, CountSchema, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {param, get, getModelSchemaRef, response} from '@loopback/rest';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {UserProfile as MyUserProfile} from '../models';
import {UserProfileRepository} from '../repositories';

@authenticate('jwt')
export class UserProfileController {
  constructor(
    @repository(UserProfileRepository)
    public userProfileRepository: UserProfileRepository,
  ) {}

  @authorize({
    resource: '/user-profiles/count',
    scopes: ['GET'],
  })
  @get('/user-profiles/count')
  @response(200, {
    description: 'UserProfile model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(@param.where(MyUserProfile) where?: Where<MyUserProfile>): Promise<Count> {
    return this.userProfileRepository.count(where);
  }

  @authorize({
    resource: '/user-profiles/{id}',
    scopes: ['GET'],
  })
  @get('/user-profiles/{id}')
  @response(200, {
    description: 'UserProfile model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(MyUserProfile, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(MyUserProfile, {exclude: 'where'})
    filter?: FilterExcludingWhere<MyUserProfile>,
  ): Promise<MyUserProfile> {
    return this.userProfileRepository.findById(id, filter);
  }
}
