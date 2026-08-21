const path = require("node:path");
const fs = require("node:fs");
const nunjucks = require("nunjucks");

/**
 * Register hmpoHtml utility global and translate filter.
 * Replaces functionality previously provided by hmpo-components.setup().
 */
const setup = (app, nunjucksEnv) => {
  // Register hmpoHtml global
  let formComponentsDir;
  try {
    const resolved = require.resolve("@govuk-one-login/frontend-ui");
    const frontendUiDir = resolved.substring(0, resolved.indexOf("@govuk-one-login/frontend-ui") + "@govuk-one-login/frontend-ui".length);
    formComponentsDir = path.resolve(frontendUiDir, "components", "form-components");
  } catch {
    // frontend-ui not installed
  }

  if (formComponentsDir) {
    const htmlMacroPath = path.resolve(formComponentsDir, "html/macro.njk");
    if (fs.existsSync(htmlMacroPath)) {
      try {
        const templateStr = '{% from "frontend-ui/components/form-components/html/macro.njk" import hmpoHtml %}{{ hmpoHtml(content) }}';
        const template = nunjucks.compile(templateStr, nunjucksEnv);
        nunjucksEnv.addGlobal("hmpoHtml", function (content) {
          return new nunjucks.runtime.SafeString(template.render({ content }));
        });
      } catch {
        // template compilation failed
      }
    }
  }

  // Register translate filter (previously provided by hmpo-components.setup())
  nunjucksEnv.addFilter("translate", function (key, options) {
    const translate = this.ctx && this.ctx.translate;
    if (typeof translate === "function") {
      return translate(key, options);
    }
    return key;
  });
};

module.exports = { setup };
