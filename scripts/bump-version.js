const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'app.config.js');
const configContent = fs.readFileSync(configPath, 'utf8');

// Find version
const versionMatch = configContent.match(/version:\s*'(\d+\.\d+\.\d+)'/);
if (!versionMatch) {
    console.error('Could not find version in app.config.js');
    process.exit(1);
}

const oldVersion = versionMatch[1];
const versionParts = oldVersion.split('.').map(Number);
versionParts[2]++; // Increment patch
const newVersion = versionParts.join('.');

console.log(`Bumping version from ${oldVersion} to ${newVersion}`);

// Replace version
let updatedContent = configContent.replace(
    /(version:\s*')(\d+\.\d+\.\d+)(')/,
    `$1${newVersion}$3`
);

// Replace buildNumber
updatedContent = updatedContent.replace(
    /(buildNumber:\s*')(\d+\.\d+\.\d+)(')/,
    `$1${newVersion}$3`
);

fs.writeFileSync(configPath, updatedContent);
console.log('Successfully updated app.config.js');
