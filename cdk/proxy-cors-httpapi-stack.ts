import { CfnAuthorizer, CorsHttpMethod, HttpApi, HttpAuthorizerType, HttpMethod } from '@aws-cdk/aws-apigatewayv2';
import { LambdaProxyIntegration } from '@aws-cdk/aws-apigatewayv2-integrations';
import { Runtime } from '@aws-cdk/aws-lambda';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { LogGroup, RetentionDays } from '@aws-cdk/aws-logs';
import { Construct, Names, RemovalPolicy, Stack, StackProps } from '@aws-cdk/core';
import { join } from 'path';

export class ProxyCorsHttpapiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const proxyFn = new NodejsFunction(this, 'HttpProxyFn', {
      entry: join(__dirname, 'lambda/http-proxy.ts'),
      functionName: 'http-proxy-fn',
      runtime: Runtime.NODEJS_14_X,
    });

    new LogGroup(this, 'HttpProxyFnLg', {
      logGroupName: `/aws/lambda/${proxyFn.functionName}`,
      retention: RetentionDays.ONE_DAY,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const httpProxyFnIntegration = new LambdaProxyIntegration({ handler: proxyFn });

    const httpApi = new HttpApi(this, 'ProxyCorsHttpApi', {
      corsPreflight: { allowMethods: [CorsHttpMethod.GET], allowOrigins: ['*'] },
    });

    // Not working - see https://github.com/aws/aws-cdk/pull/13181/files
    const authorizer = new CfnAuthorizer(this, 'HttpAuthz', {
      apiId: httpApi.apiId,
      authorizerPayloadFormatVersion: '2.0',
      authorizerType: HttpAuthorizerType.LAMBDA,
      authorizerUri: `arn:aws:apigateway:${
        process.env.CDK_DEFAULT_REGION
      }:lambda:path/2015-03-31/functions/${'arn:aws:lambda:us-east-1:336848621206:function:authz-proxy-fn'}/invocations`,
      enableSimpleResponses: true,
      identitySource: ['$request.header.Authorization'],
      name: 'HttpAuthz',
    });

    httpApi.addRoutes({
      authorizer: {
        bind: () => ({
          authorizerId: authorizer.name,
          authorizationType: HttpAuthorizerType.LAMBDA,
        }),
      },
      integration: httpProxyFnIntegration,
      methods: [HttpMethod.GET],
      path: '/',
    });
  }
}
