import { Cors, LambdaIntegration, PassthroughBehavior, RequestAuthorizer, RestApi } from '@aws-cdk/aws-apigateway';
import { Runtime } from '@aws-cdk/aws-lambda';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { LogGroup, RetentionDays } from '@aws-cdk/aws-logs';
import { Construct, Duration, RemovalPolicy, Stack, StackProps } from '@aws-cdk/core';
import { join } from 'path';

export class CustomCorsRestapiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const authzFn = new NodejsFunction(this, 'AuthzFn', {
      entry: join(__dirname, 'lambda/authorizer.ts'),
      functionName: 'authz-cors-fn',
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

    const customFn = new NodejsFunction(this, 'CustomFn', {
      entry: join(__dirname, 'lambda/custom.ts'),
      functionName: 'rest-custom-fn',
      runtime: Runtime.NODEJS_14_X,
    });

    new LogGroup(this, 'CustomFnLg', {
      logGroupName: `/aws/lambda/${customFn.functionName}`,
      retention: RetentionDays.ONE_DAY,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const customIntegration = new LambdaIntegration(customFn, {
      integrationResponses: [
        {
          responseParameters: {
            'method.response.header.Access-Control-Allow-Credentials': "'true'",
            'method.response.header.Access-Control-Allow-Origin': "'*'",
            'method.response.header.Content-Type': "'application/json'",
          },
          responseTemplates: {
            'application/json': JSON.stringify({
              message: '$util.parseJson($input.body)',
              state: 'ok',
            }),
          },
          statusCode: '200',
        },
      ],
      passthroughBehavior: PassthroughBehavior.NEVER,
      proxy: false,
      requestTemplates: {
        'application/json': JSON.stringify({
          input: 'this is the input',
          name: '$context.authorizer.name',
        }),
      },
    });

    const restApi = new RestApi(this, 'CustomCorsRestApi', {
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
      },
      defaultMethodOptions: {
        authorizer,
      },
    });

    restApi.root.addMethod('get', customIntegration, {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Content-Type': true,
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Credentials': true,
          },
        },
      ],
    });
  }
}
