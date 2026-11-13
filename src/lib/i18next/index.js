import { i18nextHandler } from "./handler";
import replaceTranslate from "./replace-translate";

export const setI18n = ({
  router,
  config: { cookieDomain, debug, secure, additionalNamespaces },
  onInit,
}) => {
  router.use(
    i18nextHandler({
      cookieDomain,
      debug,
      secure,
      additionalNamespaces,
      onInit,
    }),
  );
  router.use(replaceTranslate);
};
