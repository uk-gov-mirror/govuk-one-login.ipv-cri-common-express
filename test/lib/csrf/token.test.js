import { describe, expect, it } from "vitest";

const token = require("../../../src/lib/csrf/token");

describe("lib/csrf/token", () => {
  const consumerSecrets = ["hunter2"]; // pragma: allowlist secret
  const currentSessionCsrfSecret = "top-secret"; // pragma: allowlist secret

  describe("createSessionSecret", () => {
    it("returns a non-empty string", () => {
      const secret = token.setSessionSecret();
      expect(typeof secret).toBe("string");
      expect(secret.length).toBeGreaterThan(0);
    });

    it("returns a different value each call", () => {
      expect(token.setSessionSecret()).not.toBe(token.setSessionSecret());
    });
  });

  describe("create / verify", () => {
    it("creates a token that verifies with the same secrets", () => {
      const t = token.createCsrfToken(
        consumerSecrets,
        currentSessionCsrfSecret,
      );
      expect(
        token.verifyCsrfToken(consumerSecrets, currentSessionCsrfSecret, t),
      ).toEqual(true);
    });

    it("produces a fresh salt on each call", () => {
      const a = token.createCsrfToken(
        consumerSecrets,
        currentSessionCsrfSecret,
      );
      const b = token.createCsrfToken(
        consumerSecrets,
        currentSessionCsrfSecret,
      );
      expect(a).not.toBe(b);
    });

    it("signs with the first secret in the list", () => {
      const t = token.createCsrfToken(["new", "old"], currentSessionCsrfSecret);
      expect(
        token.verifyCsrfToken(["new"], currentSessionCsrfSecret, t),
      ).toEqual(true);
      expect(
        token.verifyCsrfToken(["old"], currentSessionCsrfSecret, t),
      ).toEqual(false);
    });

    it("rejects a token signed with a different consumer secret", () => {
      const t = token.createCsrfToken(
        ["Tr0ub4dor&3"],
        currentSessionCsrfSecret,
      );
      expect(
        token.verifyCsrfToken(consumerSecrets, currentSessionCsrfSecret, t),
      ).to.equal(false);
    });

    it("rejects a token signed with a different session secret", () => {
      const t = token.createCsrfToken(consumerSecrets, "not-my-session-secret");
      expect(
        token.verifyCsrfToken(consumerSecrets, currentSessionCsrfSecret, t),
      ).toEqual(false);
    });

    it("rejects a tampered signature", () => {
      const t = token.createCsrfToken(
        consumerSecrets,
        currentSessionCsrfSecret,
      );
      const [salt, sig] = t.split(".");
      const tampered = `${salt}.${sig.slice(0, -1)}${sig.endsWith("A") ? "B" : "A"}`;
      expect(
        token.verifyCsrfToken(
          consumerSecrets,
          currentSessionCsrfSecret,
          tampered,
        ),
      ).toEqual(false);
    });

    it("rejects a tampered salt", () => {
      const t = token.createCsrfToken(
        consumerSecrets,
        currentSessionCsrfSecret,
      );
      const [salt, sig] = t.split(".");
      const tampered = `${salt.slice(0, -1)}${salt.endsWith("A") ? "B" : "A"}.${sig}`;
      expect(
        token.verifyCsrfToken(
          consumerSecrets,
          currentSessionCsrfSecret,
          tampered,
        ),
      ).toEqual(false);
    });

    it("rejects mismatched signature length without throwing", () => {
      const t = token.createCsrfToken(
        consumerSecrets,
        currentSessionCsrfSecret,
      );
      const [salt, sig] = t.split(".");
      expect(
        token.verifyCsrfToken(
          consumerSecrets,
          currentSessionCsrfSecret,
          `${salt}.${sig}extra`,
        ),
      ).toEqual(false);
    });

    it("rejects non-string tokens", () => {
      expect(
        token.verifyCsrfToken(
          consumerSecrets,
          currentSessionCsrfSecret,
          undefined,
        ),
      ).toEqual(false);
      expect(
        token.verifyCsrfToken(consumerSecrets, currentSessionCsrfSecret, null),
      ).toEqual(false);
      expect(
        token.verifyCsrfToken(consumerSecrets, currentSessionCsrfSecret, 42),
      ).toEqual(false);
    });

    it("rejects a token with no separator", () => {
      expect(
        token.verifyCsrfToken(
          consumerSecrets,
          currentSessionCsrfSecret,
          "nosalt",
        ),
      ).toEqual(false);
    });

    it("rejects a token with an empty salt or signature", () => {
      expect(
        token.verifyCsrfToken(
          consumerSecrets,
          currentSessionCsrfSecret,
          ".sig",
        ),
      ).toEqual(false);
      expect(
        token.verifyCsrfToken(
          consumerSecrets,
          currentSessionCsrfSecret,
          "salt.",
        ),
      ).toEqual(false);
    });
  });

  describe("rotation window", () => {
    it("verifies tokens signed by the old secret while both are accepted", () => {
      const oldToken = token.createCsrfToken(["old"], currentSessionCsrfSecret);
      expect(
        token.verifyCsrfToken(
          ["new", "old"],
          currentSessionCsrfSecret,
          oldToken,
        ),
      ).toEqual(true);
    });

    it("verifies tokens signed by the new secret while both are accepted", () => {
      const newToken = token.createCsrfToken(["new"], currentSessionCsrfSecret);
      expect(
        token.verifyCsrfToken(
          ["new", "old"],
          currentSessionCsrfSecret,
          newToken,
        ),
      ).toEqual(true);
    });

    it("rejects tokens once the old secret is removed", () => {
      const oldToken = token.createCsrfToken(["old"], currentSessionCsrfSecret);
      expect(
        token.verifyCsrfToken(["new"], currentSessionCsrfSecret, oldToken),
      ).toEqual(false);
    });

    it("rejects tokens signed by an unknown secret even with multiple accepted", () => {
      const rogue = token.createCsrfToken(["rogue"], currentSessionCsrfSecret);
      expect(
        token.verifyCsrfToken(["new", "old"], currentSessionCsrfSecret, rogue),
      ).toEqual(false);
    });
  });

  describe("hmac key encoding", () => {
    it("treats pairs as distinct", () => {
      const tokenA = token.createCsrfToken(["foo"], "barbazqux");
      expect(token.verifyCsrfToken(["foobar"], "bazqux", tokenA)).toEqual(
        false,
      );
    });

    it("treats pairs that share a delimiter as distinct", () => {
      const tokenA = token.createCsrfToken(["foo:bar"], "bazqux");
      expect(token.verifyCsrfToken(["foo"], "bar:bazqux", tokenA)).toEqual(
        false,
      );
    });
  });
});
