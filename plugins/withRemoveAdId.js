const { withAndroidManifest } = require('@expo/config-plugins');

const withRemoveAdId = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const permissions = androidManifest.manifest['uses-permission'] || [];

    // Add tools:node="remove" to the AD_ID permission if it exists or add it to ensure removal
    const adIdPermission = permissions.find(
      (p) => p.$['android:name'] === 'com.google.android.gms.permission.AD_ID'
    );

    if (adIdPermission) {
        adIdPermission.$['tools:node'] = 'remove';
    } else {
        permissions.push({
            $: {
                'android:name': 'com.google.android.gms.permission.AD_ID',
                'tools:node': 'remove'
            }
        });
        androidManifest.manifest['uses-permission'] = permissions;
    }

    return config;
  });
};

module.exports = withRemoveAdId;
