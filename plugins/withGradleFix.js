const { withProjectBuildGradle } = require('@expo/config-plugins');

const withGradleFix = (config) => {
    return withProjectBuildGradle(config, (config) => {
        if (config.modResults.language === 'groovy') {
            config.modResults.contents = addMavenCentralToRepositories(config.modResults.contents);
        }
        return config;
    });
};

function addMavenCentralToRepositories(buildGradle) {
    // Add mavenCentral() to buildscript repositories
    const buildScriptPattern = /buildscript\s*\{[\s\S]*?repositories\s*\{/;
    if (buildScriptPattern.test(buildGradle)) {
        buildGradle = buildGradle.replace(
            buildScriptPattern,
            (match) => `${match}\n        mavenCentral()`
        );
    } else {
        // if buildscript block is weird or missing repositories, try to add it at the top?
        // For now, let's assume standard expo template structure.
    }

    // Add mavenCentral() to allprojects repositories
    const allProjectsPattern = /allprojects\s*\{[\s\S]*?repositories\s*\{/;
    if (allProjectsPattern.test(buildGradle)) {
        buildGradle = buildGradle.replace(
            allProjectsPattern,
            (match) => `${match}\n        mavenCentral()`
        );
    }

    return buildGradle;
}

module.exports = withGradleFix;
