const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const readline = require("readline");
const { v4: uuidv4 } = require("uuid"); // for unique IDs

module.exports.handler = async (event) => {
  for (const record of event.Records) {
    try {
      const { bucket, key } = JSON.parse(record.body);
      const s3Stream = s3.getObject({ Bucket: bucket, Key: key }).createReadStream();

      const rl = readline.createInterface({
        input: s3Stream,
        crlfDelay: Infinity,
      });

      let isHeader = true;
      for await (const line of rl) {
        if (isHeader) {
          isHeader = false;
          continue;
        }

        const [name, email, age] = line.split(",");

        const item = {
          id: uuidv4(),
          name: name.trim(),
          email: email.trim(),
          age: Number(age),
        };

        await dynamodb.put({
          TableName: "CsvData",
          Item: item,
        }).promise();

        console.log("Inserted:", item);
      }
    } catch (err) {
      console.error("Processing error:", err);
    }
  }

  return { statusCode: 200 };
};
