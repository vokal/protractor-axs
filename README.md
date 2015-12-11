# protractor-axs

This is essentially a fork of https://github.com/angular/protractor-accessibility-plugin that runs on each test instead of at the end of the suite.

Protractor will run each set of audits (depending on your configuration) on your existing end-to-end tests to ensure your site is free of obvious errors. In this kind of testing, there is no concept of "warnings"–only pass or fail. In your configuration, you can decide whether warnings should pass or fail your build.


Protractor now supports the [Accessibility Developer Tools](https://github.com/GoogleChrome/accessibility-developer-tools), the same audit library used by the [Chrome browser extension](https://chrome.google.com/webstore/detail/accessibility-developer-t/fpkknkljclfencbdbgkenhalefipecmb?hl=en). Protractor
[runs an audit](https://github.com/GoogleChrome/accessibility-developer-tools/wiki/Audit-Rules) locally by injecting the Dev Tools script into WebDriver pages, and it can diagnose issues including missing labels, incorrect ARIA attributes and color contrast.

Enable this plugin in your config file:
```js
  exports.config = {
      ...
      plugins: [ {
        chromeA11YDevTools: {
          treatWarningsAsFailures: true,
          axsConfig: {}
        },
        path: "node_modules/protractor-axs" // this path is relative to the config file
      } ]
    }
```

### axsConfig

An optional options object can be used to configure the validation rules. [See this page for options](https://github.com/GoogleChrome/accessibility-developer-tools/blob/master/README.md#configuring-the-audit)
