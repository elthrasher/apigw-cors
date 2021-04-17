import { App } from '@aws-cdk/core';

import { CustomCorsRestapiStack } from './custom-cors-restapi-stack';
import { ProxyCorsHttpapiStack } from './proxy-cors-httpapi-stack';
import { ProxyCorsRestapiStack } from './proxy-cors-restapi-stack';

const app = new App();

new CustomCorsRestapiStack(app, 'CustomCorsRestapiStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  stackName: 'custom-cors-restapi-stack',
});

new ProxyCorsRestapiStack(app, 'ProxyCorsRestapiStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  stackName: 'proxy-cors-restapi-stack',
});

new ProxyCorsHttpapiStack(app, 'ProxyCorsHttpapiStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  stackName: 'proxy-cors-httpapi-stack',
});
