import { describe, it, expect } from "vitest";

const { configure } = require("../../../src/lib/i18next/configure");
const defaultConfig = require("../../../src/lib/i18next/default-config");

describe("configure", () => {
  it("should return default config", () => {
    let config = configure();

    expect(config).toEqual({ debug: false, ...defaultConfig });
  });

  it("should return config with overwridden properties", () => {
    let { detection, debug, ...configWithoutDetection } = configure({
      secure: true,
      cookieDomain: "localhost",
      debug: true,
    });

    expect(defaultConfig).toMatchObject(configWithoutDetection);

    expect(debug).toBe(true);

    expect(detection).toEqual({
      ...defaultConfig.detection,
      cookieSecure: true,
      cookieDomain: "localhost",
    });
  });

  it("should merge additionalNamespaces into ns", () => {
    const config = configure({ additionalNamespaces: ["frontend-ui"] });

    expect(config.ns).toEqual([...defaultConfig.ns, "frontend-ui"]);
  });

  it("should not modify ns when additionalNamespaces is empty", () => {
    const config = configure({ additionalNamespaces: [] });

    expect(config.ns).toEqual(defaultConfig.ns);
  });
});
