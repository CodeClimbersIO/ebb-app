#!/usr/bin/env node

import https from 'https';
import fs from 'fs';
import { execSync } from 'child_process';

async function makeGitHubRequest(path, token, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: path,
      method: method,
      headers: {
        'User-Agent': 'Node.js',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode >= 400) {
            reject(new Error(`GitHub API Error: ${data}, Status: ${res.statusCode}`));
          } else {
            resolve(data ? JSON.parse(data) : null);
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function downloadFile(url, outputPath, token) {
  return new Promise((resolve, reject) => {
    try {
      // Use curl for downloading
      execSync(`curl -L -H "Authorization: Bearer ${token}" -H "Accept: application/octet-stream" "${url}" -o "${outputPath}"`, {
        stdio: 'inherit'
      });
      
      // Verify file size
      const stats = fs.statSync(outputPath);
      console.log(`Downloaded file size: ${stats.size} bytes`);
      
      if (stats.size === 0) {
        reject(new Error('Downloaded file is empty'));
        return;
      }
      
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

async function uploadAsset(uploadUrl, filePath, fileName, token) {
  return new Promise((resolve, reject) => {
    try {
      // Use curl for uploading
      execSync(`curl -X POST -H "Authorization: Bearer ${token}" -H "Content-Type: application/octet-stream" --data-binary "@${filePath}" "${uploadUrl}?name=${encodeURIComponent(fileName)}"`, {
        stdio: 'inherit'
      });
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

async function main() {
  const [,, token, repo, version] = process.argv;
  
  if (!token || !repo || !version) {
    console.error('Usage: process_dmg_releases.js <github_token> <owner/repo> <version>');
    process.exit(1);
  }

  try {
    console.log(`Processing DMG files for version v${version}...`);

    // Get the release by tag
    const release = await makeGitHubRequest(
      `/repos/${repo}/releases/tags/v${version}`,
      token
    );

    console.log('Found release:', release.tag_name);

    // Filter for DMG assets
    const dmgAssets = release.assets.filter(asset => asset.name.endsWith('.dmg'));

    if (dmgAssets.length === 0) {
      console.log('No DMG assets found in the release');
      return;
    }

    console.log(`Found ${dmgAssets.length} DMG assets`);

    for (const asset of dmgAssets) {
      console.log(`Processing file: ${asset.name}`);
      
      // Extract architecture (everything between last _ and .dmg)
      const archMatch = asset.name.match(/_([^_]+)\.dmg$/);
      if (!archMatch) {
        console.log(`Could not extract architecture from ${asset.name}`);
        continue;
      }
      const arch = archMatch[1];
      console.log(`Detected architecture: ${arch}`);

      // Download the asset
      const tempPath = `versioned_${arch}.dmg`;
      console.log(`Downloading to ${tempPath}...`);
      try {
        await downloadFile(asset.browser_download_url, tempPath, token);
        const stats = fs.statSync(tempPath);
        console.log(`File size after download: ${stats.size} bytes`);
      } catch (error) {
        console.error('Download failed:', error);
        continue;
      }

      // Upload with new name
      const newName = `Ebb_${arch}.dmg`;
      console.log(`Uploading as ${newName}...`);
      try {
        await uploadAsset(
          release.upload_url.replace('{?name,label}', ''),
          tempPath,
          newName,
          token
        );
        console.log('Upload successful');
      } catch (error) {
        console.error('Upload failed:', error);
        fs.unlinkSync(tempPath);
        process.exit(1);
      }

      // Cleanup
      fs.unlinkSync(tempPath);
    }

    console.log('Processing complete!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 