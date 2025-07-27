const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient();

module.exports.handler = async (event) => {
    const body = JSON.parse(event.body);
    const message = body.message;

    const apigw = new AWS.ApiGatewayManagementApi({
        endpoint: event.requestContext.domainName + "/" + event.requestContext.stage,
    });

    const connections = await db.scan({ TableName: process.env.CONNECTION_TABLE }).promise();

    const sendMessages = connections.Items.map(({ connectionId }) =>
        apigw.postToConnection({ ConnectionId: connectionId, Data: message }).promise()
    );

    await Promise.allSettled(sendMessages);

    return { statusCode: 200 };
};
