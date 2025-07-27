const {
  S3Client,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const {
  getSignedUrl,
} = require("@aws-sdk/s3-request-presigner");

const s3 = new S3Client({ region: process.env.REGION });

module.exports.handler = async (event) => {
  try {
    const bucketName = process.env.BUCKET_NAME;
    const objectKey = 'uploads/.gitignore';
    const expiresInSeconds = parseInt("300"); 

    if (!objectKey) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing 'key' query parameter" }),
      };
    }

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    const signedUrl = await getSignedUrl(s3, command, {
      expiresIn: expiresInSeconds,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        url: signedUrl,
        expiresIn: expiresInSeconds,
      }),
    };
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
