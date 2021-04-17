import { Cors, LambdaIntegration, RequestAuthorizer, RestApi } from '@aws-cdk/aws-apigateway';
import { Runtime } from '@aws-cdk/aws-lambda';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { LogGroup, RetentionDays } from '@aws-cdk/aws-logs';
import { Construct, Duration, RemovalPolicy, Stack, StackProps } from '@aws-cdk/core';
import { join } from 'path';

export class ProxyCorsRestapiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const authzFn = new NodejsFunction(this, 'AuthzFn', {
      entry: join(__dirname, 'lambda/authorizer.ts'),
      functionName: 'authz-proxy-fn',
      runtime: Runtime.NODEJS_14_X,
    });

    new LogGroup(this, 'AuthzFnLg', {
      logGroupName: `/aws/lambda/${authzFn.functionName}`,
      retention: RetentionDays.ONE_DAY,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const authorizer = new RequestAuthorizer(this, 'Authorizer', {
      handler: authzFn,
      identitySources: [],
      resultsCacheTtl: Duration.millis(0),
    });

    const proxyFn = new NodejsFunction(this, 'RestProxyFn', {
      entry: join(__dirname, 'lambda/rest-proxy.ts'),
      functionName: 'rest-proxy-fn',
      runtime: Runtime.NODEJS_14_X,
    });

    new LogGroup(this, 'RestProxyFnLg', {
      logGroupName: `/aws/lambda/${proxyFn.functionName}`,
      retention: RetentionDays.ONE_DAY,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const proxyIntegration = new LambdaIntegration(proxyFn);

    const restApi = new RestApi(this, 'ProxyCorsRestApi', {
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
      },
      defaultMethodOptions: {
        authorizer,
      },
    });

    restApi.root.addMethod('get', proxyIntegration, {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Credentials': true,
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Content-Type': true,
          },
        },
      ],
    });
  }
}
