import debugLib from "debug";
import { getConfig } from "../lib/config";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import i18n from "hmpo-i18n";

const debug = debugLib("hmpo-app:translations");

export const setupTranslation = (
  app,
  { locales = ".", hmpoComponentsDir, ...otherOptions } = {},
) => {
  const APP_ROOT = getConfig("APP_ROOT");
  const isDevEnv = Boolean(app.get("dev"));

  if (!Array.isArray(locales)) locales = [locales];

  locales = [...locales, ...(hmpoComponentsDir ? [hmpoComponentsDir] : [])];

  locales = locales
    .map((dir) => resolve(APP_ROOT, dir))
    .filter((dir) => dir && existsSync(dir));

  debug("Locales", APP_ROOT, locales);

  i18n.middleware(app, {
    baseDir: locales,
    noCache: isDevEnv,
    watch: isDevEnv,
    allowedLangs: ["en", "cy"],
    cookie: { name: "lang" },
    query: "lang",
    ...otherOptions,
  });
};
