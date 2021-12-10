import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  model,
  repository,
  Where,
} from '@loopback/repository';
import {
  param,
  get,
  del,
  getModelSchemaRef,
  oas,
  response,
  Response,
  RestBindings,
  HttpErrors,
} from '@loopback/rest';
import {inject} from '@loopback/core';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {SensingData, Project} from '../models';
import {SensingDataRepository} from '../repositories';
import {CasbinPolicyService} from '../services';
import path from 'path';

@authenticate('jwt')
export class SensingDataController {
  constructor(
    @repository(SensingDataRepository)
    public sensingDataRepository: SensingDataRepository,
    @inject('services.CasbinPolicy')
    public casbinPolicyService: CasbinPolicyService,
    @inject('storage.directory') private storageDirectory: string,
  ) {}

  @authorize({
    resource: '/sensing-data/count',
    scopes: ['GET'],
  })
  @get('/sensing-data/count')
  @response(200, {
    description: 'SensingData model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(@param.where(SensingData) where?: Where<SensingData>): Promise<Count> {
    return this.sensingDataRepository.count(where);
  }

  @authorize({
    resource: '/sensing-data',
    scopes: ['GET'],
  })
  @get('/sensing-data')
  @response(200, {
    description: 'Array of SensingData model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(SensingData, {includeRelations: true}),
        },
      },
    },
  })
  async find(@param.filter(SensingData) filter?: Filter<SensingData>): Promise<SensingData[]> {
    return this.sensingDataRepository.find(filter);
  }

  @authorize({
    resource: '/sensing-data/{id}',
    scopes: ['GET'],
  })
  @get('/sensing-data/{id}')
  @response(200, {
    description: 'SensingData model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(SensingData, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(SensingData, {exclude: 'where'})
    filter?: FilterExcludingWhere<SensingData>,
  ): Promise<SensingData> {
    return this.sensingDataRepository.findById(id, filter);
  }

  @authorize({
    resource: '/sensing-data/{id}',
    scopes: ['DELETE'],
  })
  @del('/sensing-data/{id}')
  @response(204, {
    description: 'SensingData DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    // Apply include filter
    const filter = {include: [{relation: 'project'}]};
    const sensingData = await this.sensingDataRepository.findById(id, filter);
    if (!sensingData)
      throw new HttpErrors.NotFound(`Endpoint \"DELETE /sensing-data/${id}\" not found.`);
    // Remove casbin policy
    await this.casbinPolicyService.removeSensingDataPolicy(id);
    await this.casbinPolicyService.savePolicy();
    return await this.sensingDataRepository.deleteById(id);
  }

  @authorize({
    resource: '/sensing-data/{id}/download',
    scopes: ['GET'],
  })
  @get('/sensing-data/{id}/download')
  @oas.response.file()
  async downloadById(
    @param.path.string('id') id: string,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<Response> {
    const sensingData = await this.sensingDataRepository.findById(id);
    const file = path.resolve(this.storageDirectory + sensingData.path);
    response.attachment(file);
    response.sendFile(file);
    return response;
  }
}
