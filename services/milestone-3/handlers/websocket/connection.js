const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient();

module.exports.handler = async (event) => {
    const connectionId = event.requestContext.connectionId;

    await db.put({
        TableName: process.env.CONNECTION_TABLE,
        Item: { connectionId },
    }).promise();

    return { statusCode: 200 };
};
