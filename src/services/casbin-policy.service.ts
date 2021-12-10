import {injectable, inject, BindingScope} from '@loopback/core';
import * as casbin from 'casbin';

interface ArgsProjectPolicy {
  ownerId: string;
  projectId: string;
  sensorSettingId: string;
  spatiotemporalSettingId: string;
}

@injectable({scope: BindingScope.TRANSIENT})
export class CasbinPolicyService {
  enforcer: casbin.Enforcer;

  constructor(
    @inject('casbin.enforcer.factory')
    private enforcerFactory: () => Promise<casbin.Enforcer>,
  ) {}

  async createEnforcer() {
    this.enforcer = await this.enforcerFactory();
  }

  async addProjectPolicy(
    ownerId: string,
    projectId: string,
    sensorSettingId: string,
    spatiotemporalSettingId: string,
  ): Promise<void> {
    if (!this.enforcer) await this.createEnforcer();
    const policies = [
      // p, {ownerId}, /projects/{projectId}, (PATCH)|(DELETE)
      [ownerId, `/projects/${projectId}`, '(PATCH)|(DELETE)'],
      // p, {ownerId}, /projects/{projectId}/:resource, (GET)|(POST)|(DELETE)
      [ownerId, `/projects/${projectId}/:resource`, '(GET)|(POST)|(DELETE)'],
      // p, {ownerId}, /sensor-settings/{sensorSettingId}, PATCH
      [ownerId, `/sensor-settings/${sensorSettingId}`, 'PATCH'],
      // p, {ownerId}, /spatiotemporal-settings/{spatiotemporalSettingId}, PATCH
      [ownerId, `/spatiotemporal-settings/${spatiotemporalSettingId}`, 'PATCH'],
      // p, member[{id}], /projects/{projectId}/:resource, GET
      [`member[${projectId}]`, `/projects/${projectId}/:resource`, 'GET'],
    ];
    await this.enforcer.addPolicies(policies);
    // g, {ownerId}, member[{projectId}]
    await this.enforcer.addRoleForUser(ownerId, `member[${projectId}]`);
  }

  async removeProjectPolicy(
    ownerId: string,
    projectId: string,
    sensorSettingId: string,
    spatiotemporalSettingId: string,
  ): Promise<void> {
    if (!this.enforcer) await this.createEnforcer();
    const policies = [
      // p, {ownerId}, /projects/{projectId}, (PATCH)|(DELETE)
      [ownerId, `/projects/${projectId}`, '(PATCH)|(DELETE)'],
      // p, {ownerId}, /projects/{projectId}/:resource, (GET)|(POST)|(DELETE)
      [ownerId, `/projects/${projectId}/:resource`, '(GET)|(POST)|(DELETE)'],
      // p, {ownerId}, /sensor-settings/{sensorSettingId}, PATCH
      [ownerId, `/sensor-settings/${sensorSettingId}`, 'PATCH'],
      // p, {ownerId}, /spatiotemporal-settings/{spatiotemporalSettingId}, PATCH
      [ownerId, `/spatiotemporal-settings/${spatiotemporalSettingId}`, 'PATCH'],
      // p, member[{id}], /projects/{projectId}/:resource, GET
      [`member[${projectId}]`, `/projects/${projectId}/:resource`, 'GET'],
    ];
    await this.enforcer.removePolicies(policies);
    // g, {ownerId}, member[{projectId}]
    // p, member[{id}], /projects/{projectId}/:resource, GET
    await this.enforcer.deleteRole(`member[${projectId}]`);
  }

  async removeProjectPolicies(argsProjectPolicies: ArgsProjectPolicy[]): Promise<void> {
    if (!this.enforcer) await this.createEnforcer();
    for (const argsProjectPolicy of argsProjectPolicies)
      await this.removeProjectPolicy(
        argsProjectPolicy.ownerId,
        argsProjectPolicy.projectId,
        argsProjectPolicy.sensorSettingId,
        argsProjectPolicy.spatiotemporalSettingId,
      );
  }

  async addSensingDataPolicy(
    ownerId: string,
    projectOwnerId: string,
    sensingDataId: string,
    projectId: string,
  ): Promise<void> {
    if (!this.enforcer) await this.createEnforcer();
    const policies = [
      // p, {ownerId}, /sensing-data/{sensingDataId}, (GET)|(DELETE)
      [ownerId, `/sensing-data/${sensingDataId}`, '(GET)|(DELETE)'],
      // p, {ownerId}, /sensing-data/{sensingDataId}:resource, GET
      [ownerId, `/sensing-data/${sensingDataId}/:resource`, 'GET'],
      // p, {projectOwnerId}, /sensing-data/{sensingDataId}, (GET)|(DELETE)
      [projectOwnerId, `/sensing-data/${sensingDataId}`, '(GET)|(DELETE)'],
      // p, {projectOwnerId}, /sensing-data/{sensingDataId}/:resource, GET
      [projectOwnerId, `/sensing-data/${sensingDataId}/:resource`, 'GET'],
      // p, member[{projectId}], /sensing-data/{sensingDataId}, GET
      [`member[${projectId}]`, `/sensing-data/${sensingDataId}`, 'GET'],
      // p, member[{projectId}], /sensing-data/{sensingDataId}/:resource, GET
      [`member[${projectId}]`, `/sensing-data/${sensingDataId}/:resource`, 'GET'],
    ];
    await this.enforcer.addPolicies(policies);
  }

  async removeSensingDataPolicy(sensingDataId: string): Promise<void> {
    if (!this.enforcer) await this.createEnforcer();
    // p, {ownerId}, /sensing-data/{sensingDataId}, (GET)|(DELETE)
    // p, {projectOwnerId}, /sensing-data/{sensingDataId}, (GET)|(DELETE)
    // p, member[{projectId}], /sensing-data/{sensingDataId}, GET
    await this.enforcer.removeFilteredPolicy(1, `/sensing-data/${sensingDataId}`);
    // p, {ownerId}, /sensing-data/{sensingDataId}/:resource, GET
    // p, member[{projectId}], /sensing-data/{sensingDataId}/:resource, GET
    await this.enforcer.removeFilteredPolicy(1, `/sensing-data/${sensingDataId}/:resource`);
  }

  async removeSensingDataPolicies(sensingDataIds: string[]): Promise<void> {
    if (!this.enforcer) await this.createEnforcer();
    for (const id of sensingDataIds) await this.removeSensingDataPolicy(id);
  }

  async addRequesterForUser(userId: string): Promise<void> {
    if (!this.enforcer) await this.createEnforcer();
    // g, {userId}, everyone
    await this.enforcer.addRoleForUser(userId, 'everyone');
    // g, {userId}, requester
    await this.enforcer.addRoleForUser(userId, 'requester');
  }

  async addCollaboratorForUser(userId: string): Promise<void> {
    if (!this.enforcer) await this.createEnforcer();
    // g, {userId}, everyone
    await this.enforcer.addRoleForUser(userId, 'everyone');
    // g, {userId}, requester
    await this.enforcer.addRoleForUser(userId, 'collaborator');
  }

  async deleteUser(userId: string): Promise<void> {
    if (!this.enforcer) await this.createEnforcer();
    // p, {userId}, v1, v2
    // g, {userId}, v1, v2
    await this.enforcer.deleteUser(userId);
  }

  async addMemberForUser(userId: string, projectId: string): Promise<void> {
    if (!this.enforcer) await this.createEnforcer();
    // g, {userId}, member[{projectId}]
    await this.enforcer.addRoleForUser(userId, `member[${projectId}]`);
  }

  async deleteMemberForUser(userId: string, projectId: string): Promise<void> {
    if (!this.enforcer) await this.createEnforcer();
    // g, {userId}, member[{projectId}]
    await this.enforcer.deleteRoleForUser(userId, `member[${projectId}]`);
  }

  async deleteMember(projectId: string): Promise<void> {
    if (!this.enforcer) await this.createEnforcer();
    // g, {userId}, member[{projectId}]
    await this.enforcer.deleteRole(`member[${projectId}]`);
  }

  async savePolicy(): Promise<void> {
    if (!this.enforcer) await this.createEnforcer();
    await this.enforcer.savePolicy();
  }
}
