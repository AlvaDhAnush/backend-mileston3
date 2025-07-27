const {
    CognitoIdentityProviderClient,
    InitiateAuthCommand,
    RespondToAuthChallengeCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const client = new CognitoIdentityProviderClient({
    region: process.env.region,
});

module.exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body);
        const { username, password, mfaCode, session } = body;

        if (!username || !password) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Missing username or password." }),
            };
        }

        // Step 1: Initiate Auth
        const authCommand = new InitiateAuthCommand({
            AuthFlow: "USER_PASSWORD_AUTH",
            ClientId: process.env.CLIENT_ID,
            AuthParameters: {
                USERNAME: username,
                PASSWORD: password,
            },
        });

        const response = await client.send(authCommand);

        if (response.ChallengeName === "SMS_MFA") {
            // MFA required — send session back to client for verification
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: "MFA required",
                    challengeName: response.ChallengeName,
                    session: response.Session,
                }),
            };
        }

        // Step 2: Success – return tokens
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Login successful",
                idToken: response.AuthenticationResult.IdToken,
                accessToken: response.AuthenticationResult.AccessToken,
                refreshToken: response.AuthenticationResult.RefreshToken,
            }),
        };

    } catch (error) {
        console.error("Login error:", error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.name,
                message: error.message,
            }),
        };
    }
};
