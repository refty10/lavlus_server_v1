import {
  get,
  HttpErrors,
  SchemaObject,
  oas,
  param,
  post,
  Request,
  requestBody,
  Response,
  RestBindings,
} from '@loopback/rest';
import {inject} from '@loopback/core';
import {generate} from '../utils';
import {RequestHandler} from 'express-serve-static-core';
import multer from 'multer';
import path from 'path';

interface FileAndFields {
  file: globalThis.Express.Multer.File;
  fields: any;
}

const ImageSchema: SchemaObject = {
  type: 'object',
  required: ['link'],
  properties: {
    link: {
      type: 'string',
      format: 'uri-reference',
    },
  },
};

export class ImageController {
  saveDir: string;

  constructor(
    @inject('services.FileUpload') private handler: RequestHandler,
    @inject('storage.directory') private storageDirectory: string,
    @inject('server.domain') private serverDomain: string,
  ) {
    this.saveDir = '/images';
  }

  @get('/images/{filename}')
  @oas.response.file('image/jpeg', 'image/png')
  download(
    @param.path.string('filename') fileName: string,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ) {
    const file = this.validateFileName(this.saveDir, fileName);
    // これをONにするとダウンロードダイアログが出てくる
    // response.attachment(file);
    response.sendFile(file);
    return response;
  }

  @post('/images/upload', {
    responses: {
      200: {
        content: {
          'application/json': {
            schema: ImageSchema,
          },
        },
        description: 'Image uploaded instance',
      },
    },
  })
  async upload(
    @requestBody.file({
      description: 'New image upload',
    })
    request: Request,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<object> {
    // Specify saveDir and fileId
    const fileId = generate();
    request.params = {saveDir: this.saveDir, fileId};
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
      // Error handling if unsuitable mimetype
      if (!file.mimetype.includes('image'))
        throw new HttpErrors.UnprocessableEntity(`Upload file of mimetype must be 'image'`);
      // Make response
      const savedFilename = fileId + path.extname(file.originalname);
      return {
        link: `${this.serverDomain}${this.saveDir}/${savedFilename}`,
      };
    } catch (err) {
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

  private validateFileName(targetDir: string, fileName: string) {
    const resolved = path.resolve(this.storageDirectory + targetDir, fileName);
    if (resolved.startsWith(this.storageDirectory)) return resolved;
    // The resolved file is outside storage.directory
    throw new HttpErrors.NotFound();
  }
}
