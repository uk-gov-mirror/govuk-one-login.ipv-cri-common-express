import { describe, vi, it, expect, beforeEach } from "vitest";
import * as noCacheModule from "../../../src/bootstrap/middleware/nocache";
import * as compatibilityModule from "../../../src/bootstrap/middleware/compatibility";
import { setupHeaders } from "../../../src/bootstrap/middleware/headers";

describe("headers middleware", () => {
  let app, stubs;

  beforeEach(() => {
    app = {
      disable: vi.fn(),
      set: vi.fn(),
      use: vi.fn(),
    };

    stubs = {
      compression: vi.fn().mockReturnValue("compression middleware"),
      nocache: {
        middleware: vi.fn().mockReturnValue("nocache middleware"),
      },
      compatibility: {
        middleware: vi.fn().mockReturnValue("compatibility middleware"),
      },
      helmet: vi.fn(),
    };

    stubs.helmet.frameguard = vi.fn().mockReturnValue("frameguard middleware");

    vi.spyOn(noCacheModule, "noCacheMiddleware");
    vi.spyOn(compatibilityModule, "browserCompatibilityMiddleware");
  });

  describe("headers", () => {
    it("should enable trust proxy by default", () => {
      setupHeaders(app);
      expect(app.set).toHaveBeenCalledWith("trust proxy", true);
    });

    it("should set trust proxy to config setting", () => {
      setupHeaders(app, { trustProxy: ["loopback", "localunique"] });
      expect(app.set).toHaveBeenCalledWith("trust proxy", [
        "loopback",
        "localunique",
      ]);
    });

    it("should use the nocache middleware", () => {
      setupHeaders(app);
      expect(stubs.nocache.middleware).toHaveBeenCalledWith({
        publicPath: "/public",
      });
      expect(app.use).toHaveBeenCalledWith("nocache middleware");
    });

    it("should use the nocache middleware with options", () => {
      setupHeaders(app, { publicPath: "/static" });
      expect(stubs.nocache.middleware).toHaveBeenCalledWith({
        publicPath: "/static",
      });
      expect(app.use).toHaveBeenCalledWith("nocache middleware");
    });

    it("should use the returned compression middleware", () => {
      setupHeaders(app);
      expect(stubs.compression).toHaveBeenCalledTimes(1);
      expect(stubs.compression).toHaveBeenCalledWith();
      expect(app.use).toHaveBeenCalledWith("compression middleware");
    });

    it("should not use the returned compression middleware if compression is disabled", () => {
      setupHeaders(app, { disableCompression: true });
      expect(stubs.compression).not.toHaveBeenCalled();
      expect(app.use).not.toHaveBeenCalledWith("compression middleware");
    });

    it("should use the compatibility middleware", () => {
      setupHeaders(app);
      expect(stubs.compatibility.middleware).toHaveBeenCalledWith();
      expect(app.use).toHaveBeenCalledWith("compatibility middleware");
    });
  });

  describe("security", () => {
    describe("by default without helmet config", () => {
      it("should disable the x-powered-by header", () => {
        setupHeaders(app);
        expect(app.disable).toHaveBeenCalledWith("x-powered-by");
      });

      it("should use the returned frameguard middleware", () => {
        setupHeaders(app);

        expect(stubs.helmet.frameguard).toHaveBeenCalledTimes(1);
        expect(stubs.helmet.frameguard).toHaveBeenCalledWith("sameorigin");
        expect(app.use).toHaveBeenCalledWith("frameguard middleware");
      });
    });

    describe("with helmet config", () => {
      let helmetConfig;

      beforeEach(() => {
        helmetConfig = {
          contentSecurityPolicy: false,
        };
      });

      it("should call helmet with config", () => {
        setupHeaders(app, { helmet: helmetConfig });

        expect(stubs.helmet).toHaveBeenCalledWith(helmetConfig);
      });

      it("should not directly disable the x-powered-by header", () => {
        setupHeaders(app, { helmet: helmetConfig });

        expect(app.disable).not.toHaveBeenCalledWith("x-powered-by");
      });

      it("should not directly use the returned frameguard middleware", () => {
        setupHeaders(app, { helmet: helmetConfig });

        expect(stubs.helmet.frameguard).not.toHaveBeenCalled();
        expect(app.use).not.toHaveBeenCalledWith("frameguard middleware");
      });
    });
  });
});
