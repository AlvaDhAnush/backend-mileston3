const {
    CognitoIdentityProviderClient,
    SignUpCommand,
    AdminConfirmSignUpCommand,
    AdminUpdateUserAttributesCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const client = new CognitoIdentityProviderClient({
    region: process.env.region,
});

module.exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body);
        const { username, password, name } = body;

        if (!username || !password) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Missing required fields." }),
            };
        }

        const command = new SignUpCommand({
            ClientId: process.env.CLIENT_ID,
            Username: username,
            Password: password,
            UserAttributes: [
                ...(username ? [{ Name: "email", Value: username }] : []),
                ...(name ? [{ Name: "name", Value: name }] : []),
            ],
        });

        const response = await client.send(command);

        const confirmCommand = new AdminConfirmSignUpCommand({
            UserPoolId: process.env.USER_POOL_ID,
            Username: username,
        });
        await client.send(confirmCommand);

        // Step 3: Set email_verified = true
        if (username) {
            const verifyEmailCommand = new AdminUpdateUserAttributesCommand({
                UserPoolId: process.env.USER_POOL_ID,
                Username: username,
                UserAttributes: [{ Name: "email_verified", Value: "true" }],
            });

            await client.send(verifyEmailCommand);
        }
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "User registration successful",
                userConfirmed: response.UserConfirmed,
                codeDeliveryDetails: response.CodeDeliveryDetails,
            }),
        };
    } catch (error) {
        console.error("Signup error:", error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.name,
                message: error.message,
            }),
        };
    }
};
