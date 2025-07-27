// uploadToS3.js
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
require("dotenv").config();

// Initialize S3 Client
const s3 = new S3Client({
  region: process.env.REGION, // e.g., "us-east-1"
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Function to validate and upload file
const uploadFileToS3 = async (filePath, bucketName, keyPrefix = "") => {
    console.log(process.env.AWS_ACCESS_KEY_ID);
    console.log(process.env.AWS_SECRET_ACCESS_KEY)
  try {
    // Validate file exists
    if (!fs.existsSync(filePath)) {
      throw new Error("File does not exist");
    }

    // Validate file size (<10MB here as an example)
    const stats = fs.statSync(filePath);
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (stats.size > maxSize) {
      throw new Error("File size exceeds the 10MB limit");
    }

    // Determine content type
    const contentType = mime.lookup(filePath) || "application/octet-stream";

    // Create a file stream
    const fileStream = fs.createReadStream(filePath);

    // Define S3 params
    const uploadParams = {
      Bucket: bucketName,
      Key: path.join(keyPrefix, path.basename(filePath)),
      Body: fileStream,
      ContentType: contentType,
      StorageClass: "STANDARD_IA", // STANDARD, STANDARD_IA, etc.
      Metadata: {
        uploadedBy: "NodeJS-SDKv3",
        fileType: contentType,
      },
    };

    // Upload file
    const command = new PutObjectCommand(uploadParams);
    const response = await s3.send(command);

    console.log("File uploaded successfully:", response);
  } catch (err) {
    console.error("Failed to upload file:", err.message);
  }
};

// Example Usage
uploadFileToS3("./.gitignore", "milestonetestbucket123", "uploads/");
