// plugins/withModularHeaders.js
// Expo config plugin that patches the Podfile to add :modular_headers => true
// for GoogleUtilities and RecaptchaInterop (required for AppCheckCore).
// This runs automatically during `expo prebuild` so manual Podfile edits are never needed.

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MARKER = '# [withModularHeaders] auto-patched';

const PATCH = `
  # Required for AppCheckCore Swift static library compatibility
  pod 'GoogleUtilities', :modular_headers => true
  pod 'RecaptchaInterop', :modular_headers => true
  ${MARKER}
`;

module.exports = function withModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');

      // Avoid duplicate patching
      if (contents.includes(MARKER)) return cfg;

      // Insert after `config = use_native_modules!(...)`
      contents = contents.replace(
        /(\s*config\s*=\s*use_native_modules!\([^)]*\))/,
        `$1\n${PATCH}`
      );

      fs.writeFileSync(podfilePath, contents, 'utf8');
      return cfg;
    },
  ]);
};
