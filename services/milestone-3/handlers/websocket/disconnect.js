const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient();

module.exports.handler = async (event) => {
    const connectionId = event.requestContext.connectionId;

    await db.delete({
        TableName: process.env.CONNECTION_TABLE,
        Key: { connectionId },
    }).promise();

    return { statusCode: 200 };
};
