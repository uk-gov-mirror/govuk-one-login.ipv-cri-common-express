import { describe, vi, it, expect, afterEach, beforeEach } from "vitest";
import i18n from "hmpo-i18n";
import { setupTranslation } from "../../../src/bootstrap/middleware/translation.js";

describe("translation middleware", () => {
  let app;

  beforeEach(() => {
    app = {
      use: vi.fn(),
      get: vi.fn(),
    };
    app.get.mockImplementation((arg) => {
      if (arg === "dev") return true;
    });

    vi.spyOn(i18n, "middleware");
  });

  afterEach(() => {
    i18n.middleware.mockRestore();
  });

  it("should use the i18n middleware specifying the app root as the baseDir", () => {
    setupTranslation(app);
    expect(i18n.middleware).toHaveBeenCalledWith(app, {
      baseDir: [APP_ROOT + "/test/bootstrap/fixtures"],
      noCache: true,
      watch: true,
      allowedLangs: ["en", "cy"],
      cookie: { name: "lang" },
      query: "lang",
    });
  });

  it("should include hmpo-components locales when hmpoComponentsDir is provided", () => {
    setupTranslation(app, {
      hmpoComponentsDir: APP_ROOT + "/node_modules/hmpo-components",
    });
    expect(i18n.middleware).toHaveBeenCalledWith(app, {
      baseDir: [
        APP_ROOT + "/test/bootstrap/fixtures",
        APP_ROOT + "/node_modules/hmpo-components",
      ],
      noCache: true,
      watch: true,
      allowedLangs: ["en", "cy"],
      cookie: { name: "lang" },
      query: "lang",
    });
  });

  it("should use the i18n middleware specifying a custom locales locations", () => {
    setupTranslation(app, { locales: [".", "./dir_not_found"] });
    expect(i18n.middleware).toHaveBeenCalledWith(app, {
      baseDir: [APP_ROOT + "/test/bootstrap/fixtures"],
      noCache: true,
      watch: true,
      allowedLangs: ["en", "cy"],
      cookie: { name: "lang" },
      query: "lang",
    });
  });

  it("should use the i18n middleware specifying a custom allowed lang list", () => {
    setupTranslation(app, { allowedLangs: ["fr"] });
    expect(i18n.middleware).toHaveBeenCalledWith(
      app,
      expect.objectContaining({
        allowedLangs: ["fr"],
      }),
    );
  });

  it("should use the i18n middleware specifying a custom cookie name", () => {
    setupTranslation(app, { cookie: { name: "mycookie" } });
    expect(i18n.middleware).toHaveBeenCalledWith(
      app,
      expect.objectContaining({
        cookie: { name: "mycookie" },
      }),
    );
  });

  it("should use the i18n middleware specifying a custum query lang", () => {
    setupTranslation(app, { query: "test" });
    expect(i18n.middleware).toHaveBeenCalledWith(
      app,
      expect.objectContaining({
        query: "test",
      }),
    );
  });

  it("should use the i18n middleware without dev flags in production", () => {
    app.get.mockImplementation((arg) => {
      if (arg === "dev") return false;
    });
    setupTranslation(app);
    expect(i18n.middleware).toHaveBeenCalledWith(
      app,
      expect.objectContaining({
        noCache: false,
        watch: false,
      }),
    );
  });
});
