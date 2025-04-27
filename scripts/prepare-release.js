const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');

// Ensure the archiver dependency is installed first:
try {
  require.resolve('archiver');
} catch (e) {
  console.log('Installing archiver dependency...');
  execSync('npm install archiver --save-dev', { stdio: 'inherit' });
}

// Define paths
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const releaseDir = path.join(rootDir, 'releases');
const packageJson = require(path.join(rootDir, 'package.json'));
const version = packageJson.version;

// Main build function
async function prepareRelease() {
  console.log(`Preparing release v${version}...`);

  try {
    // Clean up existing dist folder and rebuild
    console.log('Building extension...');
    execSync('npm run clean && npm run build', { stdio: 'inherit', cwd: rootDir });

    // Create releases directory if it doesn't exist
    await fs.ensureDir(releaseDir);

    // Create a zip archive of the dist folder
    const zipFilePath = path.join(releaseDir, `sentinel-mk2-v${version}.zip`);
    console.log(`Creating zip archive: ${zipFilePath}`);
    
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    archive.pipe(output);
    archive.directory(distDir, false);
    await archive.finalize();

    console.log('Release preparation complete!');
    console.log(`Zip file created at: ${zipFilePath}`);
    console.log('\nNext steps:');
    console.log('1. Commit any pending changes');
    console.log('2. Create a new tag: git tag -a v' + version + ' -m "Release v' + version + '"');
    console.log('3. Push changes and tags: git push && git push --tags');
    console.log('4. Upload the zip file to GitHub releases');
  } catch (error) {
    console.error('Error during release preparation:', error);
    process.exit(1);
  }
}

// Run the release preparation
prepareRelease();
