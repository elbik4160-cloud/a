module.exports = function(api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./",
            "@crm/shared-lib": "../../packages/shared-lib/src",
            "@crm/realtime": "../../packages/realtime/src"
          }
        }
      ],
      "react-native-reanimated/plugin"
    ]
  };
};
