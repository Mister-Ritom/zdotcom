const { withAppBuildGradle } = require('@expo/config-plugins');

const withAndroidSigning = (config) => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      let contents = config.modResults.contents;

      const appendBlock = `

android {
    signingConfigs {
        release {
            def storeFilePath = System.getenv("Z_KEYSTORE_PATH")
            if (storeFilePath != null) {
                storeFile file(storeFilePath)
                storePassword System.getenv("Z_KEYSTORE_PASSWORD")
                keyAlias System.getenv("Z_KEYSTORE_ALIAS")
                keyPassword System.getenv("Z_KEYSTORE_PASSWORD")
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
`;

      if (!contents.includes('System.getenv("Z_KEYSTORE_PATH")')) {
        config.modResults.contents = contents + appendBlock;
      }
    }
    return config;
  });
};

module.exports = withAndroidSigning;
