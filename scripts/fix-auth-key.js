const { spawn } = require('child_process');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// 1. Generate a new RSA private key
console.log("Generating new RSA private key...");
const { privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

console.log("Key generated successfully.");
console.log("Key preview:", privateKey.substring(0, 50) + "...");

// Check for backslashes (should not be any in a standard PEM)
if (privateKey.includes('\\')) {
    console.error("WARNING: Generated key contains backslashes! This is unexpected.");
} else {
    console.log("Verification: Key contains no backslashes.");
}

// 2. Set the environment variable using the Convex CLI directly via Node
// This avoids shell escaping issues entirely.
const convexCliPath = path.resolve('node_modules', 'convex', 'bin', 'main.js');

console.log(`Using Convex CLI at: ${convexCliPath}`);
console.log("Setting JWT_PRIVATE_KEY in Convex environment...");

const child = spawn('node', [convexCliPath, 'env', 'set', 'JWT_PRIVATE_KEY', privateKey], {
    stdio: 'inherit',
    shell: false
});

child.on('close', (code) => {
    if (code === 0) {
        console.log("Successfully set JWT_PRIVATE_KEY.");
    } else {
        console.error(`Failed to set JWT_PRIVATE_KEY. Exit code: ${code}`);
    }
});
