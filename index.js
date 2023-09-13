const { CommunicationIdentityClient } = require('@azure/communication-identity');    
const { PublicClientApplication, CryptoProvider } = require('@azure/msal-node');
const express = require("express");
const cors = require('cors');
const path = require('path');
var url = require('url');
// You will need to set environment variables in .env
const SERVER_PORT =  8080 || 80;
const clientId = "{client-id}"
const tenantId = "{tenant-id}"
const scopes = [
    "https://auth.msft.communication.azure.com/Teams.ManageCalls",
    "https://auth.msft.communication.azure.com/Teams.ManageChats"
];
// Create configuration object that will be passed to MSAL instance on creation.
const msalConfig = {
    auth: {
        clientId: clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        
        
    }
};

  


const getRedirectUri = (req) => {
  return url.format({
    protocol: 'https',
    host: req.get('host'),
    pathname: 'redirect'
  });
}


const connectionString = "endpoint={acs_connectionstring}"

// Instantiate the identity client
const identityClient = new CommunicationIdentityClient(connectionString);


// Create an instance of PublicClientApplication
const pca = new PublicClientApplication(msalConfig);
const provider = new CryptoProvider();

const app = express();

app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});
app.use(express.static(path.join(__dirname, 'public')));


app.listen(SERVER_PORT, () => console.log(`Communication access token application started on ${SERVER_PORT}!`))




let pkceVerifier = "";



app.get('/', async(req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
  
app.get('/auth', async (req, res) => {
    // Generate PKCE Codes before starting the authorization flow
    const {verifier, challenge} = await provider.generatePkceCodes();
    pkceVerifier = verifier;
    
    const authCodeUrlParameters = {
        scopes: scopes,
        redirectUri: getRedirectUri(req),
        codeChallenge: challenge, 
        codeChallengeMethod: "S256",
        
        
    };
    // Get url to sign user in and consent to scopes needed for application
    pca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
        res.redirect(response);
    }).catch((error) => console.log(JSON.stringify(error)));
});

app.get('/acs', async (req, res) => {
    const jsonContent = JSON.stringify("Token received!");        
    res.end(jsonContent);
});

app.get('/redirect', async (req, res) => {
    // Create request parameters object for acquiring the AAD token and object ID of a Teams user
    
    const tokenRequest = {
        code: req.query.code,
        scopes: scopes,
        redirectUri: getRedirectUri(req),
        codeVerifier: pkceVerifier,
        
    };
    // Retrieve the AAD token and object ID of a Teams user
    pca.acquireTokenByCode(tokenRequest).then(async(response) => {
        console.log("Response:", response);
        let teamsUserAadToken = response.accessToken;
        let userObjectId = response.uniqueId;
        //TODO: the following code snippets go here
        let accessToken = await identityClient.getTokenForTeamsUser({
            teamsUserAadToken: teamsUserAadToken,
            clientId: clientId,
            userObjectId: userObjectId,
        });

        
        const redirectACSToken = url.format({
            protocol: req.protocol,
            host: req.get('host'),
            pathname: 'acs'
          });

        res.redirect(redirectACSToken + `?token=${accessToken.token}&expiresOn=${accessToken.expiresOn.toUTCString()}`)

        
        
    }).catch((error) => {
        console.log(error);
        res.status(500).send(error);
    });
});


