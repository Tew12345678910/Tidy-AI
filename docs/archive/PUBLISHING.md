# Publishing Tidy AI to npm

## Prerequisites

1. **npm Account**: Create one at https://www.npmjs.com/signup
2. **Verify Email**: Check your email and verify your npm account
3. **2FA Recommended**: Enable two-factor authentication for security

## Step 1: Prepare for Publishing

### Check Package Name Availability

```bash
npm search tidy-ai
```

If the name is taken, update `package.json`:

```json
{
  "name": "@your-username/tidy-ai"
}
```

### Verify package.json

Make sure these fields are correct:

- `name`: Package name (must be unique on npm)
- `version`: Start with 1.0.0
- `description`: Clear description
- `author`: Your name or GitHub username
- `license`: MIT
- `repository`: Your GitHub repo URL
- `keywords`: Searchable terms

### Update README Links

Replace placeholder URLs in README.md:

```bash
# Find and replace
# https://github.com/yourusername/tidy-ai
# with
# https://github.com/Tew12345678910/Ai-file-management
```

## Step 2: Build the Package

```bash
# Clean previous builds
rm -rf dist .next

# Install dependencies
npm install

# Build everything
npm run build

# Verify build output
ls -la dist/
ls -la .next/
```

Expected structure:

```
dist/
├── cli/
│   ├── index.js
│   ├── config.js
│   └── server-manager.js
└── server/
    └── index.js
.next/
└── (Next.js build files)
```

## Step 3: Test Locally

```bash
# Link package locally
npm link

# Test installation
tidyai --version
tidyai --help

# Test functionality
tidyai init
tidyai run -d
tidyai status
tidyai stop

# Clean up
npm unlink -g tidy-ai
```

## Step 4: Login to npm

```bash
# Login to npm
npm login

# Verify you're logged in
npm whoami
```

## Step 5: Dry Run (Recommended)

```bash
# See what will be published
npm pack --dry-run

# Or create a tarball to inspect
npm pack

# Extract and inspect
tar -xzf tidy-ai-1.0.0.tgz
ls -la package/

# Clean up
rm -rf package/ tidy-ai-1.0.0.tgz
```

## Step 6: Publish to npm

### First-Time Publish

```bash
# Publish to npm
npm publish

# If using scoped package (@username/tidy-ai)
npm publish --access public
```

### Update Version and Republish

```bash
# Bump version (choose one)
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0

# Publish new version
npm publish
```

## Step 7: Verify Publication

```bash
# View on npm
open https://www.npmjs.com/package/tidy-ai

# Install from npm in a new directory
cd /tmp
npm install -g tidy-ai

# Test it works
tidyai --version
tidyai init
tidyai run

# Clean up
npm uninstall -g tidy-ai
```

## Step 8: Post-Publication

### Update README Badge

Add to README.md:

```markdown
[![npm version](https://badge.fury.io/js/tidy-ai.svg)](https://www.npmjs.com/package/tidy-ai)
[![npm downloads](https://img.shields.io/npm/dm/tidy-ai.svg)](https://www.npmjs.com/package/tidy-ai)
```

### Create GitHub Release

```bash
# Tag the release
git tag v1.0.0
git push origin v1.0.0

# Create release on GitHub
# Go to: https://github.com/Tew12345678910/Ai-file-management/releases/new
# - Tag: v1.0.0
# - Title: Tidy AI v1.0.0
# - Description: Initial release
```

### Announce

Share on:

- Twitter/X
- Reddit (r/programming, r/node, r/commandline)
- Dev.to
- Hacker News
- Your blog

## Troubleshooting

### "Package name already exists"

Change the package name:

```json
{
  "name": "@your-username/tidy-ai"
}
```

### "Need to login"

```bash
npm logout
npm login
```

### "Build fails"

```bash
# Clean everything
rm -rf node_modules dist .next
npm install
npm run build
```

### "Permission denied" when publishing

```bash
# Check you're logged in
npm whoami

# Verify package ownership
npm owner ls tidy-ai
```

### Files missing after publish

Check `.npmignore` and `files` array in package.json:

```json
{
  "files": [
    "dist/",
    ".next/",
    "public/",
    "scripts/postinstall.js",
    "README.md",
    "QUICKSTART.md",
    "LICENSE"
  ]
}
```

## Version Management Strategy

### Semantic Versioning (SemVer)

- **Patch** (1.0.x): Bug fixes, minor changes
- **Minor** (1.x.0): New features, backwards compatible
- **Major** (x.0.0): Breaking changes

### Release Checklist

Before each release:

- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped
- [ ] Built successfully
- [ ] Tested locally
- [ ] Git committed and tagged

## Maintenance

### Update Package

```bash
# Make changes
# Update version
npm version patch

# Rebuild
npm run build

# Publish
npm publish

# Tag in git
git push origin main --tags
```

### Deprecate Version

```bash
npm deprecate tidy-ai@1.0.0 "Please upgrade to 1.0.1"
```

### Unpublish (within 72 hours only)

```bash
npm unpublish tidy-ai@1.0.0
```

## Security

### Enable 2FA

```bash
npm profile enable-2fa auth-and-writes
```

### Use npm tokens in CI/CD

```bash
npm token create --read-only
```

## Quick Reference

```bash
# Check what will be published
npm pack --dry-run

# Publish
npm publish

# Update patch version and publish
npm version patch && npm publish

# View package info
npm view tidy-ai

# Check download stats
npm view tidy-ai downloads

# Deprecate old version
npm deprecate tidy-ai@1.0.0 "Upgrade to latest"
```

## Success Criteria

After publishing, verify:

- ✅ Package visible on npmjs.com
- ✅ `npm install -g tidy-ai` works
- ✅ `tidyai --version` shows correct version
- ✅ `tidyai init && tidyai run` works
- ✅ README displays correctly on npm
- ✅ All files included in package

## Next Steps

1. Monitor downloads and feedback
2. Respond to GitHub issues
3. Plan future features
4. Regular maintenance releases
5. Build community

Good luck! 🚀
