const { SESClient, SendTemplatedEmailCommand } = require('@aws-sdk/client-ses');

const ses = new SESClient({ region: process.env.region }); // use env for region

module.exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { toEmail, name, orderId } = body;

    const params = {
      Source: 'dalva@7edge.com', // Must be a verified sender
      Destination: {
        ToAddresses: toEmail, // Must be an array
      },
      Template: 'sampleTemplate', // Name of the template created in SES
      TemplateData: JSON.stringify({
        name,
        orderId,
      }),
    };

    const command = new SendTemplatedEmailCommand(params);
    const response = await ses.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Email sent successfully!', messageId: response.MessageId }),
    };
  } catch (error) {
    console.error('Error sending templated email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send templated email', details: error.message }),
    };
  }
};
