import { APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (): Promise<APIGatewayProxyResult> => {
  return {
    body: JSON.stringify({ state: 'ok' }),
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    statusCode: 200,
  };
};
