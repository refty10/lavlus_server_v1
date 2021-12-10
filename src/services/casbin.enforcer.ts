import * as casbin from 'casbin';
import {MongoAdapter} from 'casbin-mongodb-adapter';
import path from 'path';
import {config} from '../datasources';

export async function getCasbinEnforcer(): Promise<casbin.Enforcer> {
  const model = path.resolve(__dirname, '../../casbin/rbac_with_keymatch_model.conf');
  const adapter = await MongoAdapter.newAdapter({
    uri: `${config.connector}://${config.host}`,
    collection: 'Casbin',
    database: config.database,
    option: {
      useUnifiedTopology: true,
    },
  });
  return await casbin.newEnforcer(model, adapter);
}
