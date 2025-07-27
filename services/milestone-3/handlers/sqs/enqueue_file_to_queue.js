const AWS = require("aws-sdk");
const sqs = new AWS.SQS();

module.exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { key } = body;

    if (!key) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing 'key' in request body" }),
      };
    }

    const message = {
      bucket: process.env.BUCKET_NAME,
      key,
    };

    await sqs.sendMessage({
      QueueUrl: process.env.JOB_QUEUE_URL,
      MessageBody: JSON.stringify(message),
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "File enqueued for processing" }),
    };
  } catch (error) {
    console.error("Enqueue error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to enqueue file" }),
    };
  }
};
