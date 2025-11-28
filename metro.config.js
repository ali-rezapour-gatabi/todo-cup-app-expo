const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver.assetExts.push('wasm');
// Limit Metro workers to avoid crashes with multi-process transforms in this environment.
defaultConfig.maxWorkers = 2;

module.exports = defaultConfig;
