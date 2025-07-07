// msalConfig.js
const { ConfidentialClientApplication } = require("@azure/msal-node");
const fs = require("fs");
const path = require("path");

const {
  AZURE_CLIENT_ID,
  AZURE_TENANT_ID,
  AZURE_THUMBPRINT,
  AZURE_KEY,
} = process.env;

if (
  AZURE_CLIENT_ID &&
  AZURE_TENANT_ID &&
  AZURE_THUMBPRINT &&
  AZURE_KEY
) {
  let privateKey;

  try {
    privateKey = fs.readFileSync(path.resolve(AZURE_KEY), "utf8");
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
  };

  module.exports = new ConfidentialClientApplication(config);
} else {
  console.warn("Missing Azure AD environment variables — MSAL client will not be initialised.");
  module.exports = null;
}
