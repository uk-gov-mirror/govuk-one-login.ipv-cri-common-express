import deepCloneMerge from "deep-clone-merge";

export const featureFlagMiddleware =
  ({ featureFlags } = {}) =>
  (req, res, next) => {
    req.featureFlags = deepCloneMerge.extend(
      req.featureFlags || {},
      featureFlags,
      req.session?.featureFlags,
    );
    res.locals.featureFlags = req.featureFlags;
    next();
  };

export const getFlags = (req) => req.featureFlags || {};

export const isEnabled = (flag, req) => getFlags(req)[flag] === true;

export const isDisabled = (flag, req) => !isEnabled(flag, req);

export const redirectIfEnabled = (flag, url) => (req, res, next) => {
  if (isEnabled(flag, req)) {
    return res.redirect(url);
  }
  next();
};

export const redirectIfDisabled = (flag, url) => (req, res, next) => {
  if (isDisabled(flag, req)) {
    return res.redirect(url);
  }
  next();
};

export const routeIf = (flag, handlerIf, handlerElse) => (req, res, next) => {
  if (isEnabled(flag, req)) {
    handlerIf(req, res, next);
  } else {
    handlerElse(req, res, next);
  }
};
