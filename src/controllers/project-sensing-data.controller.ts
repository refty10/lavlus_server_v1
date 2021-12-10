import {Filter, repository} from '@loopback/repository';
import {
  get,
  HttpErrors,
  getModelSchemaRef,
  param,
  post,
  Request,
  requestBody,
  Response,
  RestBindings,
} from '@loopback/rest';
import {inject} from '@loopback/core';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {Project, SensingData} from '../models';
import {ProjectRepository, SensingDataRepository} from '../repositories';
import {RequestHandler} from 'express-serve-static-core';
import {CasbinPolicyService} from '../services';
import multer from 'multer';
import path from 'path';

interface FileAndFields {
  file: globalThis.Express.Multer.File;
  fields: any;
}

@authenticate('jwt')
export class ProjectSensingDataController {
  constructor(
    @repository(ProjectRepository)
    protected projectRepository: ProjectRepository,
    @repository(SensingDataRepository)
    public sensingDataRepository: SensingDataRepository,
    @inject(SecurityBindings.USER, {optional: true})
    private user: UserProfile,
    @inject('services.CasbinPolicy')
    public casbinPolicyService: CasbinPolicyService,
    @inject('services.FileUpload')
    private handler: RequestHandler,
  ) {}

  @authorize({
    resource: '/projects/{id}/sensing-data',
    scopes: ['GET'],
  })
  @get('/projects/{id}/sensing-data', {
    responses: {
      '200': {
        description: 'Array of Project has many SensingData',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(SensingData)},
          },
        },
      },
    },
  })
  async find(
    @param.path.string('id') id: string,
    @param.query.object('filter') filter?: Filter<SensingData>,
  ): Promise<SensingData[]> {
    return this.projectRepository.sensingData(id).find(filter);
  }

  @authorize({
    resource: '/projects/{id}/sensing-data',
    scopes: ['POST'],
  })
  @post('/projects/{id}/sensing-data', {
    responses: {
      '200': {
        description: 'SensingData model instance',
        content: {'application/json': {schema: getModelSchemaRef(SensingData)}},
      },
    },
  })
  async create(
    @param.path.string('id') projectId: typeof Project.prototype.id,
    @requestBody.file({
      description: 'New sensingData upload',
    })
    request: Request,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<SensingData> {
    // Create empty sensingData
    const savedSensingData = await this.projectRepository.sensingData(projectId).create({});
    // Specify saveDir and fileId
    const saveDir = `/sensing-data/${projectId}`;
    request.params = {saveDir, fileId: savedSensingData.id};

    try {
      // Save processing
      const {file, fields} = await new Promise<FileAndFields>((resolve, reject) => {
        this.handler(request, response, (err: unknown) => {
          if (err) reject(err);
          else resolve(this.getFileAndFields(request));
        });
      });
      // Error handling if nothing file
      if (!file) throw new HttpErrors.UnprocessableEntity('Required file');
      // TODO:
      // Error handling if unsuitable mimetype
      // if (file.mimetype === '')
      //   throw new HttpErrors.UnprocessableEntity(
      //     `Upload file of mimetype must be 'image'`,
      //   );
      // Update sensingData
      savedSensingData.originalname = file.originalname;
      savedSensingData.path = path.join(
        saveDir,
        savedSensingData.id + path.extname(file.originalname),
      );
      savedSensingData.size = file.size;
      savedSensingData.ownerId = this.user[securityId];
      await this.sensingDataRepository.updateById(savedSensingData.id, savedSensingData);
      // Add casbin policies
      const project = await this.projectRepository.findById(projectId);
      await this.casbinPolicyService.addSensingDataPolicy(
        savedSensingData.ownerId,
        project.ownerId,
        savedSensingData.id,
        project.id,
      );
      return savedSensingData;
    } catch (err) {
      // Delete SensingData if error occurred
      await this.sensingDataRepository.deleteById(savedSensingData.id);
      // Error handling if unsuitable key
      if (err instanceof multer.MulterError)
        throw new HttpErrors.UnprocessableEntity(`Upload file of key must be 'file'`);
      throw err;
    }
  }

  private getFileAndFields(request: Request): FileAndFields {
    return {
      file: request.file as globalThis.Express.Multer.File,
      fields: request.body,
    };
  }
}
