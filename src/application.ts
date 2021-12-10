import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {RestExplorerBindings, RestExplorerComponent} from '@loopback/rest-explorer';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {ServiceMixin} from '@loopback/service-proxy';
import {MySequence} from './sequence';
// JWT Authentication
import {AuthenticationComponent} from '@loopback/authentication';
import {
  JWTAuthenticationComponent,
  UserServiceBindings,
  TokenServiceBindings,
  RefreshTokenServiceBindings,
} from '@loopback/authentication-jwt';
// Authorization
import {AuthorizationComponent, AuthorizationTags} from '@loopback/authorization';
// Services
import {
  MyUserService,
  JWTService,
  DefaultAuthorizationProvider,
  getCasbinEnforcer,
  FileUploadProvider,
  CasbinPolicyService,
} from './services';
// Binding contents
import {DbDataSource} from './datasources';
import {UserRepository, UserCredentialsRepository} from './repositories';
// Other
import * as casbin from 'casbin';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import csvSync from 'csv-parse/lib/sync';

export {ApplicationConfig};

export class LavlusServerApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });

    // Components
    this.component(RestExplorerComponent);
    this.component(AuthenticationComponent);
    this.component(AuthorizationComponent);
    this.component(JWTAuthenticationComponent);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };
  }

  async setUpBindings(): Promise<void> {
    // JWTAuthenticationComponent
    this.dataSource(DbDataSource, UserServiceBindings.DATASOURCE_NAME);
    this.bind(UserServiceBindings.USER_SERVICE).toClass(MyUserService);
    this.bind(UserServiceBindings.USER_REPOSITORY).toClass(UserRepository);
    this.bind(UserServiceBindings.USER_CREDENTIALS_REPOSITORY).toClass(UserCredentialsRepository);
    this.dataSource(DbDataSource, RefreshTokenServiceBindings.DATASOURCE_NAME);
    this.bind(TokenServiceBindings.TOKEN_SERVICE).toClass(JWTService);
    // AuthorizationComponent
    this.bind('casbin.enforcer.factory').to(getCasbinEnforcer);
    this.bind(`services.CasbinPolicy`).toClass(CasbinPolicyService);
    this.bind('authorizationProviders.default-provider')
      .toProvider(DefaultAuthorizationProvider)
      .tag(AuthorizationTags.AUTHORIZER);
    // FileUpload
    this.bind('storage.directory').to(path.join(__dirname, '../uploads'));
    this.configure('services.FileUpload').to(await this.createMulterOptions());
    this.bind('services.FileUpload').toProvider(FileUploadProvider);
  }

  // Unfortunately, TypeScript does not allow overriding methods inherited
  // from mapped types. https://github.com/microsoft/TypeScript/issues/38496
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  async start(): Promise<void> {
    await this.setUpBindings();
    await this.migrateCasbinPolicy();
    return super.start();
  }

  async migrateCasbinPolicy(): Promise<void> {
    const enforcerFactory: () => Promise<casbin.Enforcer> = await this.get(
      'casbin.enforcer.factory',
    );
    const enforcer = await enforcerFactory();

    const policies: string[][] = csvSync(
      fs.readFileSync(path.resolve(__dirname, '../casbin/static_casbin_policies.csv')),
      {trim: true},
    );

    for (const policy of policies)
      !(await enforcer.hasNamedPolicy(policy[0], ...policy.slice(1))) &&
        (await enforcer.addNamedPolicy(policy[0], ...policy.slice(1)));
  }

  async createMulterOptions(): Promise<multer.Options> {
    // コントローラからRequestHandlerへの値を引数として渡せない
    // なので、便宜上コントローラでrequest.paramsに値を入れてここで受け取る
    const baseDir: string = await this.get('storage.directory');
    return {
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          // req.params.saveDirに保存先のディレクトリを指定
          const savePath = path.join(baseDir, req.params.saveDir);
          fs.mkdirSync(savePath, {recursive: true});
          cb(null, savePath);
        },
        filename: (req, file, cb) => {
          // req.params.fileIdにファイルのidを指定
          const saveFilename = req.params.fileId + path.extname(file.originalname);
          cb(null, saveFilename);
        },
      }),
    };
  }
}
