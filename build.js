const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// Define paths
const rootDir = __dirname;
const distDir = path.join(rootDir, 'dist');

// Main build function
async function build() {
  console.log('Building Sentinel Security Assistant extension...');

  try {
    // Clean up existing dist folder if it exists
    console.log('Cleaning dist folder...');
    await fs.emptyDir(distDir);

    // Run webpack build
    console.log('Running webpack build...');
    execSync('npm run build', { stdio: 'inherit' });

    console.log('Build complete! Extension files are in the dist folder.');
    console.log('To load the extension in Chrome, go to chrome://extensions/, enable Developer mode,');
    console.log('and click "Load unpacked" to select your dist folder.');
  } catch (error) {
    console.error('Error during build process:', error);
    process.exit(1);
  }
}

// Run the build
build();
