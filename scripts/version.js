const fs = require('fs');
const path = require('path');

function getVersion() {
  return process.env.VERSION || '1.0.0';
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
