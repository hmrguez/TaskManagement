// Karma configuration file for Angular v20+
// Note: Do NOT require any @angular/* karma plugin directly; the Angular CLI builder wires it.

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    // Rely on Karma's plugin auto-loading via devDependencies (karma-*) and Angular builder.
    // Alternatively, you can list specific plugins without Angular-specific ones:
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage')
    ],
    client: {
      jasmine: {},
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    files: [],
    preprocessors: {},
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false,
    restartOnFileChange: true,
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage'),
      subdir: '.',
      reporters: [{ type: 'html' }, { type: 'text-summary' }]
    }
  });
};
