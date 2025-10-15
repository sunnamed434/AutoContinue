import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getVersion() {
  return process.env.VERSION || '1.0.0';
}

function getVersionName() {
  return process.env.VERSION_NAME || null;
}

function deriveNumericVersion(raw) {
  if (!raw) return '1.0.0';
  const match = raw.match(/\d+\.\d+\.\d+/);
  return match ? match[0] : '1.0.0';
}

function updateManifest(version, versionName) {
  const manifestPath = path.join(__dirname, '..', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.version = deriveNumericVersion(version);
  if (versionName) {
    manifest.version_name = versionName;
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Updated manifest.json version to ${version}`);
}

function updatePackageJson(version) {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  packageJson.version = deriveNumericVersion(version);
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`Updated package.json version to ${version}`);
}

function main() {
  const version = getVersion();
  const versionName = getVersionName();
  console.log(`Setting version to: ${version}`);
  if (versionName) {
    console.log(`Setting version_name to: ${versionName}`);
  }

  updateManifest(version, versionName);
  updatePackageJson(version);
  
  console.log('Version update complete!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { getVersion, updateManifest, updatePackageJson };
