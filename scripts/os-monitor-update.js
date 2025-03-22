#!/usr/bin/env node

import fs from 'fs'
import { execSync } from 'child_process'
import path from 'path'

// Function to increment patch version
function incrementPatchVersion(version) {
  const [major, minor, patch] = version.split('.').map(Number)
  return `${major}.${minor}.${patch + 1}`
}

// Function to update version in Cargo.toml
function updateVersion(cargoFilePath) {
  const content = fs.readFileSync(cargoFilePath, 'utf8')
  const versionRegex = /version\s*=\s*"([0-9]+\.[0-9]+\.[0-9]+)"/
  const match = content.match(versionRegex)
  
  if (!match) {
    throw new Error(`Could not find version in ${cargoFilePath}`)
  }
  
  const currentVersion = match[1]
  const newVersion = incrementPatchVersion(currentVersion)
  
  // Update version in Cargo.toml
  const updatedContent = content.replace(
    versionRegex,
    `version = "${newVersion}"`
  )
  
  fs.writeFileSync(cargoFilePath, updatedContent)
  
  return newVersion
}

// Function to update dependency version
function updateDependency(cargoFilePath, dependency, newVersion) {
  let content = fs.readFileSync(cargoFilePath, 'utf8')
  
  // Update dependency with curly braces format
  const braceRegex = new RegExp(`${dependency}\\s*=\\s*\\{\\s*version\\s*=\\s*"[0-9]+\\.[0-9]+\\.[0-9]+"`, 'g')
  content = content.replace(braceRegex, `${dependency} = { version = "${newVersion}"`)
  
  // Update simple dependency format
  const simpleRegex = new RegExp(`${dependency}\\s*=\\s*"[0-9]+\\.[0-9]+\\.[0-9]+"`, 'g')
  content = content.replace(simpleRegex, `${dependency} = "${newVersion}"`)
  
  fs.writeFileSync(cargoFilePath, content)
}

// Function to run a command and log output
function runCommand(command, cwd) {
  try {
    console.log(`Running: ${command}`)
    const output = execSync(command, { cwd, encoding: 'utf8' })
    console.log(output)
  } catch (error) {
    console.error(`Command failed: ${command}`)
    console.error(error.message)
    process.exit(1)
  }
}

// Main function
async function main() {
  // validate we're running from the root of the project
  const rootDir = process.cwd()
  if (!fs.existsSync(path.join(rootDir, 'package.json'))) {
    throw new Error('Not running from the root of the project')
  }
  
  console.log('=== Updating os-monitor ===')
  const osMonitorDir = path.join(rootDir,  'os-monitor')
  console.log(osMonitorDir)
  const osMonitorCargoPath = path.join(osMonitorDir, 'Cargo.toml')
  
  // Update version in Cargo.toml
  const osMonitorVersion = updateVersion(osMonitorCargoPath)
  console.log(`Updated os-monitor to version ${osMonitorVersion}`)
  
  // Commit and push changes
  runCommand('cargo build', osMonitorDir)
  runCommand('git add .', osMonitorDir)
  runCommand(`git commit -m "patch ${osMonitorVersion}"`, osMonitorDir)
  runCommand('git push', osMonitorDir)
  
  // Publish to crates.io
  runCommand('cargo publish', osMonitorDir)
  
  console.log('=== Updating os-monitor-service ===')
  const osMonitorServiceDir = path.join(rootDir, 'os-monitor-service')
  const osMonitorServiceCargoPath = path.join(osMonitorServiceDir, 'Cargo.toml')
  
  // Update version in Cargo.toml
  const osMonitorServiceVersion = updateVersion(osMonitorServiceCargoPath)
  console.log(`Updated os-monitor-service to version ${osMonitorServiceVersion}`)
  
  // Update os-monitor dependency
  updateDependency(osMonitorServiceCargoPath, 'os-monitor', osMonitorVersion)
  console.log(`Updated os-monitor dependency to ${osMonitorVersion}`)
  
  // Commit and push changes
  runCommand('cargo build', osMonitorServiceDir)
  runCommand('git add .', osMonitorServiceDir)
  runCommand(`git commit -m "patch ${osMonitorServiceVersion}"`, osMonitorServiceDir)
  runCommand('git push', osMonitorServiceDir)
  
  // Publish to crates.io
  runCommand('cargo publish', osMonitorServiceDir)
  
  console.log('=== Updating Tauri app dependencies ===')
  const tauriDir = path.join(rootDir, 'src-tauri')
  const tauriCargoPath = path.join(tauriDir, 'Cargo.toml')
  
  // Update dependencies in Tauri's Cargo.toml
  updateDependency(tauriCargoPath, 'os-monitor', osMonitorVersion)
  updateDependency(tauriCargoPath, 'os-monitor-service', osMonitorServiceVersion)
  console.log(`Updated Tauri dependencies to os-monitor ${osMonitorVersion} and os-monitor-service ${osMonitorServiceVersion}`)
  
  // // Commit Tauri changes
  runCommand('cargo build', tauriDir)
  runCommand('git add .', tauriDir)
  runCommand(`git commit -m "Update os-monitor: ${osMonitorVersion} and os-monitor-service: ${osMonitorServiceVersion}"`, tauriDir)
  
  console.log('All updates completed successfully!')
}

main().catch(error => {
  console.error('An error occurred:', error)
  process.exit(1)
}) 
