const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const readline = require("readline");

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
          isHeader = false; // skip header
          continue;
        }

        const [name, email, age] = line.split(",");
        console.log("Row:", { name, email, age });

        // Optionally insert to DB here
      }
    } catch (err) {
      console.error("Processing error:", err);
    }
  }

  return { statusCode: 200 };
};
