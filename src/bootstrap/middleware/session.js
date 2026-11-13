import expressSession from "express-session";
import { redisClientStore } from "../lib/redis-client";

export const sessionMiddleware = ({
  cookieName = "hmpo.sid",
  secret = "not-secret",
  ttl = 30000,
  sessionStore,
  cookieOptions = {},
} = {}) => {
  if (!sessionStore) {
    const RedisStore = require("connect-redis")(expressSession);
    sessionStore = new RedisStore({
      client: redisClientStore.client,
      ttl,
    });
  }

  const session = expressSession({
    store: sessionStore,
    cookie: {
      secure: "auto",
      ...cookieOptions,
    },
    key: cookieName,
    secret: secret,
    resave: true,
    saveUninitialized: true,
  });

  return [
    session,
    (req, res, next) => {
      req.isNewBrowser = !req.cookies[cookieName];
      req.session["start-time"] = req.session["start-time"] || Date.now();
      res.locals.sessionid = req.sessionID;
      req.sessionTTL = ttl;
      res.locals.sessionTTL = ttl;
      next();
    },
  ];
};
