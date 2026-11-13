import { describe, vi, it, expect, beforeEach, afterEach } from "vitest";
import { redisClientStore } from "../../../src/bootstrap/lib/redis-client.js";
import { sessionMiddleware } from "../../../src/bootstrap/middleware/session.js";

const expressSession = vi.fn();

vi.mock("express-session", () => ({ default: expressSession }));

describe("Session", () => {
  let redisStub;

  beforeEach(() => {
    redisStub = {
      on: vi.fn(),
    };
    redisClientStore.client = redisStub;
    expressSession.mockReset();
  });

  afterEach(() => {
    redisClientStore.client = redisStub;
  });

  it("exports an object of middleware", () => {
    expect(typeof session).toBe("object");
  });

  describe("session middleware", () => {
    describe("session store", () => {
      let sessionStore;
      beforeEach(() => {
        sessionStore = {
          on: vi.fn(),
        };
      });

      it("should be set with default properties", () => {
        sessionMiddleware({ sessionStore });

        expect(expressSession).toHaveBeenCalledWith({
          store: sessionStore,
          cookie: { secure: "auto" },
          key: "hmpo.sid",
          secret: "not-secret",
          resave: true,
          saveUninitialized: true,
        });
      });

      it("should allow override of cookie key", () => {
        sessionMiddleware({ cookieName: "cookie-name", sessionStore });

        expect(expressSession).toHaveBeenCalledWith(
          expect.objectContaining({
            key: "cookie-name",
          }),
        );
      });

      it("should allow override of secret", () => {
        sessionMiddleware({ secret: "very-secret", sessionStore });

        expect(expressSession).toHaveBeenCalledWith(
          expect.objectContaining({
            secret: "very-secret",
          }),
        );
      });

      describe("with cookieOptions", () => {
        let cookieOptions;

        it("should add additional properties", () => {
          cookieOptions = {
            domain: ".example.com",
          };

          sessionMiddleware({ cookieOptions, sessionStore });

          expect(expressSession).toHaveBeenCalledWith(
            expect.objectContaining({
              cookie: expect.objectContaining({ domain: ".example.com" }),
            }),
          );
        });

        it("should allow override of existing options", () => {
          cookieOptions = {
            secure: "false",
          };

          sessionMiddleware({ cookieOptions, sessionStore });

          expect(expressSession).toHaveBeenCalledWith(
            expect.objectContaining({
              cookie: { secure: "false" },
            }),
          );
        });

        it("should not change properties unless overriden", () => {
          cookieOptions = {
            domain: ".example.com",
          };

          sessionMiddleware({ cookieOptions, sessionStore });

          expect(expressSession).toHaveBeenCalledWith(
            expect.objectContaining({
              cookie: expect.objectContaining({ secure: "auto" }),
            }),
          );
        });
      });
    });
  });
});
