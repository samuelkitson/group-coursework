// Inspired by: https://learn.microsoft.com/en-us/entra/identity-platform/how-to-web-app-node-use-certificate?tabs=windows-powershell

const { ConfidentialClientApplication } = require("@azure/msal-node");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const { AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_THUMBPRINT, AZURE_KEY } = process.env;

if ( AZURE_CLIENT_ID && AZURE_TENANT_ID && AZURE_THUMBPRINT && AZURE_KEY ) {
  let privateKey;

  try {
    const privateKeySource = fs.readFileSync(path.resolve(AZURE_KEY), "utf8");
    const privateKeyObj = crypto.createPrivateKey({
      key: privateKeySource,
      format: "pem",
    });
    privateKey = privateKeyObj.export({format: "pem", type: "pkcs8"});
  } catch (err) {
    console.warn("Failed to read Azure AD private key file:", err.message);
    module.exports = null;
    return;
  }

  const config = {
    auth: {
      clientId: AZURE_CLIENT_ID,
      authority: `https://login.microsoftonline.com/${AZURE_TENANT_ID}`,
      clientCertificate: {
        thumbprint: AZURE_THUMBPRINT,
        privateKey,
      },
    },
    scopes: ["User.Read"],
  };

  module.exports = new ConfidentialClientApplication(config);
} else {
  console.warn("Missing Azure AD environment variables — MSAL client will not be initialised");
  module.exports = null;
}
