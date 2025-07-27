const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { Parser } = require("json2csv");
const ExcelJS = require("exceljs");
const { v4: uuidv4 } = require("uuid");
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoClient = new DynamoDBClient({ region: 'ap-south-1' });
const s3Client = new S3Client({ region: 'ap-south-1' });

const BUCKET_NAME = process.env.BUCKET_NAME; // replace with your actual bucket name

module.exports.handler = async (event) => {
    const queryParams = event.queryStringParameters || {};
    const filetype = queryParams.filetype || "csv";
    const columns = queryParams.columns ? queryParams.columns.split(",") : null;

    try {
        const command = new ScanCommand({ TableName: 'milestone3' });
        const response = await dynamoClient.send(command);
        let items = response.Items.map(unmarshall) || [];

        if (columns?.length) {
            items = items.map(item => {
                const filtered = {};
                columns.forEach(col => filtered[col] = item[col]);
                return filtered;
            });
        }

        let buffer, contentType, extension;

        if (filetype === "csv") {
            const parser = new Parser({ fields: columns || Object.keys(items[0] || {}) });
            const csv = parser.parse(items);
            buffer = Buffer.from(csv);
            contentType = "text/csv";
            extension = "csv";
        } else if (filetype === "xlsx") {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Export");
            worksheet.columns = (columns || Object.keys(items[0] || {})).map(col => ({
                header: col,
                key: col,
            }));
            worksheet.addRows(items);
            buffer = await workbook.xlsx.writeBuffer();
            contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            extension = "xlsx";
        } else {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Invalid filetype" }),
            };
        }

        const fileKey = `exports/export-${uuidv4()}.${extension}`;

        // Upload to S3
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileKey,
            Body: buffer,
            ContentType: contentType
        }));

        // Generate signed URL valid for 5 minutes
        const url = await getSignedUrl(s3Client, new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileKey
        }), { expiresIn: 300 });

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `File uploaded successfully`,
                downloadUrl: url
            })
        };
    } catch (error) {
        console.error("Error exporting/uploading:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Export failed" }),
        };
    }
};
