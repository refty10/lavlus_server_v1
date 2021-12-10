import {
  AuthorizationContext,
  AuthorizationDecision,
  AuthorizationMetadata,
  AuthorizationRequest,
  Authorizer,
} from '@loopback/authorization';
import {inject, Provider} from '@loopback/core';
import * as casbin from 'casbin';

const DEFAULT_SCOPE = 'execute';

// Class level authorizer
export class DefaultAuthorizationProvider implements Provider<Authorizer> {
  constructor(
    @inject('casbin.enforcer.factory')
    private enforcerFactory: () => Promise<casbin.Enforcer>,
  ) {}

  /**
   * @returns authenticateFn
   */
  value(): Authorizer {
    return this.authorize.bind(this);
  }

  async authorize(
    authorizationCtx: AuthorizationContext,
    metadata: AuthorizationMetadata,
  ): Promise<AuthorizationDecision> {
    let object = metadata.resource ?? authorizationCtx.resource;

    // URLに{id}が含まれている場合の置換処理
    if (object.includes('{id}')) {
      const objectId = authorizationCtx.invocationContext.args[0];
      object = object.replace('{id}', objectId);
    }

    const request: AuthorizationRequest = {
      subject: authorizationCtx.principals[0].id,
      object,
      action: metadata.scopes?.[0] ?? DEFAULT_SCOPE,
    };

    const enforcer = await this.enforcerFactory();
    const allow = await enforcer.enforce(request.subject, request.object, request.action);

    console.log('= Casbin Authorization =');
    console.log('Request:', [request.subject, request.object, request.action]);
    console.log('final result: ', allow);

    if (allow) return AuthorizationDecision.ALLOW;
    else if (allow === false) return AuthorizationDecision.DENY;
    return AuthorizationDecision.ABSTAIN;
  }
}
