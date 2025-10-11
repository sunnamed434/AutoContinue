/**
 * Version Management Script
 * 
 * Updates version in manifest.json and package.json from git tag or environment variable
 */

const fs = require('fs');
const path = require('path');

function getVersion() {
  // Priority order:
  // 1. Environment variable (for CI/CD)
  // 2. Git tag (for local development)
  // 3. Default fallback
  
  if (process.env.VERSION) {
    return process.env.VERSION;
  }
  
  try {
    const { execSync } = require('child_process');
    const gitTag = execSync('git describe --tags --exact-match HEAD 2>/dev/null', { encoding: 'utf8' }).trim();
    if (gitTag) {
      // Remove 'v' prefix if present, otherwise use tag as-is
      return gitTag.startsWith('v') ? gitTag.substring(1) : gitTag;
    }
  } catch (error) {
    // No git tag found, continue to fallback
  }
  
  return '0.0.0'; // Default fallback
}

function updateManifest(version) {
  const manifestPath = path.join(__dirname, '..', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.version = version;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Updated manifest.json version to ${version}`);
}

function updatePackageJson(version) {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  packageJson.version = version;
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`Updated package.json version to ${version}`);
}

function main() {
  const version = getVersion();
  console.log(`Setting version to: ${version}`);
  
  updateManifest(version);
  updatePackageJson(version);
  
  console.log('Version update complete!');
}

if (require.main === module) {
  main();
}

module.exports = { getVersion, updateManifest, updatePackageJson };
