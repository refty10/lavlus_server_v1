import {model, property} from '@loopback/repository';
import {
  param,
  get,
  post,
  response,
  HttpErrors,
  requestBody,
  SchemaObject,
  getModelSchemaRef,
} from '@loopback/rest';
import {inject} from '@loopback/core';
import {UserProfile} from '@loopback/security';
import {authenticate, TokenService, UserService} from '@loopback/authentication';
import {
  RefreshTokenServiceBindings,
  TokenObject,
  TokenServiceBindings,
  UserServiceBindings,
  RefreshTokenService,
  Credentials,
} from '@loopback/authentication-jwt';
import {User, UserProfile as MyUserProfile} from '../models';
import {UserRepository} from '../repositories';
import {genSalt, hash} from 'bcryptjs';
import {CasbinPolicyService} from '../services';

// Describes the type of grant object taken in by method "refresh"
type RefreshGrant = {
  refreshToken: string;
};

// Describes the schema of grant object
const RefreshGrantSchema: SchemaObject = {
  type: 'object',
  properties: {
    accessToken: {
      type: 'string',
    },
    refreshToken: {
      type: 'string',
    },
  },
};

const RefreshLoginSchema: SchemaObject = {
  type: 'object',
  required: ['refreshToken'],
  properties: {
    refreshToken: {
      type: 'string',
    },
  },
};

const RefreshSchema: SchemaObject = {
  type: 'object',
  properties: {
    accessToken: {
      type: 'object',
    },
  },
};

// Describes the request body of grant object
const RefreshGrantRequestBody = {
  description: 'Reissuing Acess Token',
  required: true,
  content: {
    'application/json': {schema: RefreshGrantSchema},
  },
};

// Describe the schema of user credentials
const CredentialsSchema: SchemaObject = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
    },
    password: {
      type: 'string',
      minLength: 8,
    },
  },
};

@model()
export class SignInResponse extends User {
  @property({
    required: true,
  })
  token: string;
}

@model()
export class Requester extends User {
  @property({
    required: true,
  })
  userProfile: MyUserProfile;
}

@model()
export class NewCollaboratorRequest extends User {
  @property({
    type: 'string',
    required: true,
  })
  password: string;
}

@model()
export class NewRequesterRequest extends Requester {
  @property({
    type: 'string',
    required: true,
  })
  password: string;
}

export const CredentialsRequestBody = {
  description: 'The input of login function',
  required: true,
  content: {
    'application/json': {schema: CredentialsSchema},
  },
};

export class UserController {
  constructor(
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public jwtService: TokenService,
    @inject(UserServiceBindings.USER_SERVICE)
    public userService: UserService<User, Credentials>,
    @inject(UserServiceBindings.USER_REPOSITORY)
    public userRepository: UserRepository,
    @inject(RefreshTokenServiceBindings.REFRESH_TOKEN_SERVICE)
    public refreshService: RefreshTokenService,
    @inject('services.CasbinPolicy')
    public casbinPolicyService: CasbinPolicyService,
  ) {}

  @post('/users/signup/requesters', {
    responses: {
      '200': {
        description: 'Requester model instance',
        content: {
          'application/json': {
            schema: {
              'x-ts-type': Requester,
            },
          },
        },
      },
    },
  })
  async signUpRequester(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(NewRequesterRequest, {
            title: 'NewRequester',
            exclude: ['id', 'roles', 'ownerId', 'updatedAt', 'createdAt'],
          }),
        },
      },
    })
    newRequesterRequest: NewRequesterRequest,
  ): Promise<Requester> {
    // Error handling
    if (!(await this.checkUniqueEmail(newRequesterRequest.email))) {
      const err = new HttpErrors.UnprocessableEntity('This email has been registered.');
      err.code = 'HAS_BEEN_REGISTERED';
      throw err;
    }
    // Separate data
    const password = await hash(newRequesterRequest.password, await genSalt());
    const userProfile = newRequesterRequest.userProfile;
    delete (newRequesterRequest as Partial<NewRequesterRequest>).password;
    delete (newRequesterRequest as Partial<NewRequesterRequest>).userProfile;
    // Add roles
    newRequesterRequest.roles = ['everyone', 'requester'];
    // Create User & UserProfile
    const savedUser = await this.userRepository.create(newRequesterRequest);
    await this.userRepository.userCredentials(savedUser.id).create({password});
    const savedUserProfile = await this.userRepository
      .userProfile(savedUser.id)
      .create(userProfile);
    // Add casbin policy
    await this.casbinPolicyService.addRequesterForUser(savedUser.id);
    // Make response
    savedUser.userProfile = savedUserProfile;
    return savedUser;
  }

  @post('/users/signup/collaborators', {
    responses: {
      '200': {
        description: 'User model instance',
        content: {
          'application/json': {
            schema: {
              'x-ts-type': User,
            },
          },
        },
      },
    },
  })
  async signUpCollaborator(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(NewCollaboratorRequest, {
            title: 'NewCollaborators',
            exclude: ['id', 'roles', 'updatedAt', 'createdAt'],
          }),
        },
      },
    })
    newCollaboratorRequest: NewCollaboratorRequest,
  ): Promise<User> {
    // Error handling
    if (!(await this.checkUniqueEmail(newCollaboratorRequest.email))) {
      const err = new HttpErrors.UnprocessableEntity('This email has been registered.');
      err.code = 'HAS_BEEN_REGISTERED';
      throw err;
    }
    // Separate data
    const password = await hash(newCollaboratorRequest.password, await genSalt());
    delete (newCollaboratorRequest as Partial<NewCollaboratorRequest>).password;
    // Add roles
    newCollaboratorRequest.roles = ['everyone', 'collaborator'];
    // Create User
    const savedUser = await this.userRepository.create(newCollaboratorRequest);
    await this.userRepository.userCredentials(savedUser.id).create({password});
    // Add casbin policy
    await this.casbinPolicyService.addCollaboratorForUser(savedUser.id);
    return savedUser;
  }

  /**
   * A login function that returns an access token. After login, include the token
   * in the next requests to verify your identity.
   * @param credentials User email and password
   */
  @post('/users/login', {
    responses: {
      '200': {
        description: 'Token',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  })
  async login(
    @requestBody(CredentialsRequestBody) credentials: Credentials,
  ): Promise<SignInResponse> {
    // ensure the user exists, and the password is correct
    const user = await this.userService.verifyCredentials(credentials);
    // convert a User object into a UserProfile object (reduced set of properties)
    const userProfile = this.userService.convertToUserProfile(user);
    // create a JSON Web Token based on the user profile
    const token = await this.jwtService.generateToken(userProfile);

    return {...user, token} as SignInResponse;
  }

  @authenticate('jwt')
  @get('/users/requesters/{id}')
  @response(200, {
    description: 'Requester model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Requester),
      },
    },
  })
  async findRequesterById(
    // id
    @param.path.string('id') id: string,
  ): Promise<Requester> {
    // Apply include filter
    const filter = {include: [{relation: 'userProfile'}]};
    const user = await this.userRepository.findById(id, filter);
    // Error handling if nothing requester in user.roles
    if (!user.roles.includes('requester')) {
      const err = new HttpErrors.NotFound(`Entity not found: User with id "${id}".`);
      err.code = 'ENTITY_NOT_FOUND';
      throw err;
    }
    return user as Requester;
  }

  /**
   * A login function that returns refresh token and access token.
   * @param credentials User email and password
   */
  @post('/users/refresh-login', {
    responses: {
      '200': {
        description: 'Token',
        content: {
          'application/json': {schema: RefreshLoginSchema},
        },
      },
    },
  })
  async refreshLogin(
    @requestBody(CredentialsRequestBody) credentials: Credentials,
  ): Promise<TokenObject> {
    // ensure the user exists, and the password is correct
    const user = await this.userService.verifyCredentials(credentials);
    // convert a User object into a UserProfile object (reduced set of properties)
    const userProfile: UserProfile = this.userService.convertToUserProfile(user);
    const accessToken = await this.jwtService.generateToken(userProfile);
    const tokens = await this.refreshService.generateToken(userProfile, accessToken);
    return tokens;
  }

  @post('/refresh', {
    responses: {
      '200': {
        description: 'Token',
        content: {
          'application/json': {schema: RefreshSchema},
        },
      },
    },
  })
  async refresh(
    @requestBody(RefreshGrantRequestBody) refreshGrant: RefreshGrant,
  ): Promise<TokenObject> {
    return this.refreshService.refreshToken(refreshGrant.refreshToken);
  }

  async checkUniqueEmail(email: string): Promise<boolean> {
    const count = await this.userRepository.count({email});
    return !(count.count > 0);
  }

  async checkUniqueUsername(username: string): Promise<boolean> {
    const count = await this.userRepository.count({username});
    return !(count.count > 0);
  }
}
