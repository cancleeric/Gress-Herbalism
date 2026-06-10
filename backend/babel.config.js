const pluginTransformModulesCommonJS = require('/Users/yinghaowang/HurricaneDigital/Gress-Herbalism/frontend/node_modules/@babel/plugin-transform-modules-commonjs');

module.exports = {
  plugins: [pluginTransformModulesCommonJS],
  presets: [
    [require.resolve('babel-preset-current-node-syntax')]
  ]
};
