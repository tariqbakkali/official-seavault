const { withGradleProperties } = require('@expo/config-plugins');

const withGradleTimeout = (config) => {
    return withGradleProperties(config, (config) => {
        // Increase Gradle HTTP/HTTPS timeout to 2 minutes (120 seconds = 120000 ms)
        const timeoutMs = '120000';

        // Add or modify timeout properties
        const propsToAdd = [
            { type: 'property', key: 'systemProp.http.connectionTimeout', value: timeoutMs },
            { type: 'property', key: 'systemProp.http.socketTimeout', value: timeoutMs },
            { type: 'property', key: 'systemProp.https.connectionTimeout', value: timeoutMs },
            { type: 'property', key: 'systemProp.https.socketTimeout', value: timeoutMs },
            // Gradle 5+ uses org.gradle.internal.http.* properties
            { type: 'property', key: 'org.gradle.internal.http.connectionTimeout', value: timeoutMs },
            { type: 'property', key: 'org.gradle.internal.http.socketTimeout', value: timeoutMs },
        ];

        propsToAdd.forEach((newProp) => {
            const existingPropIndex = config.modResults.findIndex(
                (item) => item.type === 'property' && item.key === newProp.key
            );
            if (existingPropIndex !== -1) {
                config.modResults[existingPropIndex].value = newProp.value;
            } else {
                config.modResults.push(newProp);
            }
        });

        return config;
    });
};

module.exports = withGradleTimeout;
