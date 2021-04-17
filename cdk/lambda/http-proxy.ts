import { APIGatewayProxyResultV2 } from 'aws-lambda';

export const handler = async (): Promise<APIGatewayProxyResultV2> => {
  return {
    body: JSON.stringify({ state: 'ok' }),
    statusCode: 200,
  };
};
