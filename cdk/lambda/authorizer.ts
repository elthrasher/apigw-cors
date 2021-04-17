import { APIGatewayAuthorizerResult, APIGatewayTokenAuthorizerEvent } from 'aws-lambda';

const generatePolicy = (methodArn: string): APIGatewayAuthorizerResult => {
  const policy: APIGatewayAuthorizerResult = {
    // context: { stuff: JSON.stringify({ name: 'Matt' }) },
    context: { name: 'Matt' },
    principalId: 'api user',
    policyDocument: {
      Statement: [
        {
          Action: ['execute-api:Invoke'],
          Effect: 'Allow',
          Resource: methodArn,
        },
      ],
      Version: '2012-10-17',
    },
  };
  return policy;
};

export const handler = async (event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
  return generatePolicy(event.methodArn);
};
