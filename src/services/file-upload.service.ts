import {config, Provider} from '@loopback/core';
import {RequestHandler} from 'express-serve-static-core';
import multer from 'multer';
/**
 * A provider to return an `Express` request handler from `multer` middleware
 */

export class FileUploadProvider implements Provider<RequestHandler> {
  constructor(@config() private options: multer.Options = {}) {
    if (!this.options.storage) {
      // Default to in-memory storage
      this.options.storage = multer.memoryStorage();
    }
  }

  value(): RequestHandler {
    return multer(this.options).single('file');
  }
}
