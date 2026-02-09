#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("\n🔍 Tidy AI Pre-Publish Checklist\n");

let allChecks = true;

// Check 1: package.json exists and is valid
console.log("📦 Checking package.json...");
try {
  const pkg = require("../package.json");

  if (pkg.name === "tidy-ai" || pkg.name.startsWith("@")) {
    console.log("  ✅ Package name: " + pkg.name);
  } else {
    console.log("  ❌ Invalid package name");
    allChecks = false;
  }

  if (pkg.version) {
    console.log("  ✅ Version: " + pkg.version);
  } else {
    console.log("  ❌ Version missing");
    allChecks = false;
  }

  if (pkg.description) {
    console.log("  ✅ Description present");
  } else {
    console.log("  ⚠️  Description missing");
  }

  if (pkg.bin && pkg.bin.tidyai) {
    console.log("  ✅ Binary entry point configured");
  } else {
    console.log("  ❌ Binary entry point missing");
    allChecks = false;
  }

  if (pkg.author) {
    console.log("  ✅ Author: " + pkg.author);
  } else {
    console.log("  ⚠️  Author missing");
  }

  if (pkg.license) {
    console.log("  ✅ License: " + pkg.license);
  } else {
    console.log("  ⚠️  License missing");
  }

  if (pkg.repository && pkg.repository.url) {
    console.log("  ✅ Repository configured");
  } else {
    console.log("  ⚠️  Repository URL missing");
  }
} catch (error) {
  console.log("  ❌ package.json error: " + error.message);
  allChecks = false;
}

// Check 2: Build files exist
console.log("\n🏗️  Checking build files...");
const distPath = path.join(__dirname, "..", "dist");
const nextPath = path.join(__dirname, "..", ".next");

if (fs.existsSync(distPath)) {
  console.log("  ✅ dist/ directory exists");

  const cliPath = path.join(distPath, "cli", "index.js");
  const serverPath = path.join(distPath, "server", "index.js");

  if (fs.existsSync(cliPath)) {
    console.log("  ✅ CLI built: dist/cli/index.js");
  } else {
    console.log("  ❌ CLI not built");
    allChecks = false;
  }

  if (fs.existsSync(serverPath)) {
    console.log("  ✅ Server built: dist/server/index.js");
  } else {
    console.log("  ❌ Server not built");
    allChecks = false;
  }
} else {
  console.log("  ❌ dist/ directory missing - run npm run build");
  allChecks = false;
}

if (fs.existsSync(nextPath)) {
  console.log("  ✅ .next/ directory exists");
} else {
  console.log("  ❌ .next/ directory missing - run npm run build");
  allChecks = false;
}

// Check 3: Required files
console.log("\n📄 Checking required files...");
const requiredFiles = ["README.md", "LICENSE", "QUICKSTART.md"];
requiredFiles.forEach((file) => {
  const filePath = path.join(__dirname, "..", file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file} exists`);
  } else {
    console.log(`  ❌ ${file} missing`);
    allChecks = false;
  }
});

// Check 4: Git status
console.log("\n📊 Checking git status...");
try {
  const status = execSync("git status --porcelain", { encoding: "utf8" });
  if (status.trim() === "") {
    console.log("  ✅ Working directory clean");
  } else {
    console.log("  ⚠️  Uncommitted changes detected");
    console.log("     Consider committing before publishing");
  }
} catch (error) {
  console.log("  ⚠️  Not a git repository or git not available");
}

// Check 5: npm login
console.log("\n👤 Checking npm authentication...");
try {
  const user = execSync("npm whoami", { encoding: "utf8" }).trim();
  console.log("  ✅ Logged in as: " + user);
} catch (error) {
  console.log("  ❌ Not logged in to npm");
  console.log("     Run: npm login");
  allChecks = false;
}

// Final summary
console.log("\n" + "=".repeat(50));
if (allChecks) {
  console.log("✅ All critical checks passed!");
  console.log("\n📦 Ready to publish:");
  console.log("   npm publish");
  console.log("\n   Or dry run first:");
  console.log("   npm pack --dry-run");
  process.exit(0);
} else {
  console.log("❌ Some checks failed");
  console.log("\n🔧 Fix the issues above and try again");
  console.log("\n   Build: npm run build");
  console.log("   Login: npm login");
  process.exit(1);
}
