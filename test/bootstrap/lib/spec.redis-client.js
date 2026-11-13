import { describe, vi, expect, beforeEach, afterEach, it } from "vitest";

import redis from "redis";
import fakeredis from "fakeredis";
import {
  closeRedisClient,
  redisClientStore,
  setupRedisClient,
} from "../../../src/bootstrap/lib/redis-client.js";

describe("Redis Client", () => {
  let redisStub, fakeredisStub, loggerStub;

  beforeEach(() => {
    redisStub = {
      connected: true,
      connect: vi.fn(),
      sendCommand: vi.fn(),
      on: vi.fn(),
      once: vi.fn(),
      quit: vi.fn(),
    };
    fakeredisStub = { ...redisStub };

    vi.spyOn(redis, "createClient").mockReturnValue(redisStub);
    vi.spyOn(fakeredis, "createClient").mockReturnValue(fakeredisStub);
    redisClientStore.client = null;

    loggerStub = LOGGER_RESET();
  });

  afterEach(() => {
    redis.createClient.mockRestore();
    fakeredis.createClient.mockRestore();
  });

  it("exports functions", () => {
    expect(typeof setupRedisClient).toBe("function");
    expect(typeof closeRedisClient).toBe("function");
  });

  describe("setup", () => {
    it("creates a new redis client", () => {
      const client = setupRedisClient({ host: "abc123", port: 123 });
      expect(redis.createClient).toHaveBeenCalledTimes(1);
      expect(redis.createClient).toHaveBeenCalledWith({
        legacyMode: true,
        socket: {
          port: 123,
          host: "abc123",
        },
      });
      expect(redisStub.connect).toHaveBeenCalled();
      expect(client).toEqual(redisStub);
      expect(redisClientStore.client).toEqual(client);
    });

    it("creates a new redis client using default port", () => {
      setupRedisClient({ host: "abc123" });
      expect(redis.createClient).toHaveBeenCalledWith({
        legacyMode: true,
        socket: {
          port: 6379,
          host: "abc123",
        },
      });
      expect(redisStub.connect).toHaveBeenCalled();
    });

    it("creates a new redis client with a connection string", () => {
      const client = setupRedisClient({
        connectionString: "user:pass@host:port",
      });
      expect(redis.createClient).toHaveBeenCalledTimes(1);
      expect(redis.createClient).toHaveBeenCalledWith({
        legacyMode: true,
        url: "user:pass@host:port",
      });
      expect(redisStub.connect).toHaveBeenCalled();
      expect(client).toEqual(redisStub);
      expect(redisClientStore.client).toEqual(client);
    });

    it("passes other redis options to redis", () => {
      setupRedisClient({
        connectionString: "user:pass@host:port",
        foo: "bar",
      });
      expect(redis.createClient).toHaveBeenCalledWith({
        legacyMode: true,
        foo: "bar",
        url: "user:pass@host:port",
      });
      expect(redisStub.connect).toHaveBeenCalled();
    });

    it("reconnects to redis if there is an existing redis client", () => {
      redisClientStore.client = redisStub;
      const client = setupRedisClient({
        connectionString: "user:pass@host:port",
      });
      expect(redisStub.quit).toHaveBeenCalled();
      expect(redis.createClient).toHaveBeenCalledTimes(1);
      expect(redis.createClient).toHaveBeenCalledWith({
        legacyMode: true,
        url: "user:pass@host:port",
      });
      expect(redisStub.connect).toHaveBeenCalled();
      expect(redisClientStore.client).toEqual(client);
    });

    it("should log an error redis error event", () => {
      redisStub.on.mockImplementation((event, callback) => {
        if (event === "error") {
          callback(new Error());
        }
      });
      setupRedisClient({ connectionString: "user:pass@host:port" });
      expect(loggerStub.error).toHaveBeenCalled();
    });

    it("should handle connect events", () => {
      redisStub.on.mockImplementationOnce((event, callback) => {
        if (event === "connect") {
          callback();
        }
      });
      setupRedisClient({ connectionString: "user:pass@host:port" });
      expect(loggerStub.info).toHaveBeenCalled();
      expect(redisStub.sendCommand).toHaveBeenCalledWith("CLIENT", [
        "SETNAME",
        expect.any(String),
      ]);
    });

    it("should handle reconnect events", () => {
      redisStub.on.mockImplementation((event, callback) => {
        if (event === "reconnecting") {
          callback();
        }
      });
      setupRedisClient({ connectionString: "user:pass@host:port" });
      expect(loggerStub.info).toHaveBeenCalled();
    });

    it("should create a in-memory redis server with no connection details", () => {
      let client = setupRedisClient();

      expect(redis.createClient).not.toHaveBeenCalled();

      expect(fakeredis.createClient).toHaveBeenCalledTimes(1);
      expect(fakeredis.createClient).toHaveBeenCalledWith();

      expect(client).toEqual(fakeredisStub);
      expect(redisClientStore.client).toEqual(client);
    });

    it("should log an error fake redis error event", () => {
      redisStub.on.mockImplementationOnce((event, callback) => {
        if (event === "error") {
          callback(new Error());
        }
      });
      setupRedisClient();
      expect(loggerStub.error).toHaveBeenCalled();
    });
  });

  describe("close", () => {
    it("closes an existing connected client connection", () => {
      let cb = vi.fn();
      redisClientStore.client = redisStub;
      closeRedisClient(cb);
      expect(redisStub.once).toHaveBeenCalledWith("end", cb);
      expect(redisStub.quit).toHaveBeenCalledWith();
      expect(redisClientStore.client).toBeNull();
    });

    it("calls the callback if the client is not connected", () => {
      let cb = vi.fn();
      redisStub.connected = false;
      redisClientStore.client = redisStub;
      closeRedisClient(cb);
      expect(cb).toHaveBeenCalledTimes(1);
      expect(redisStub.quit).not.toHaveBeenCalled();
      expect(redisClientStore.client).toBeNull();
    });

    it("calls the callback if there is no redis client", () => {
      let cb = vi.fn();
      closeRedisClient(cb);
      expect(cb).toHaveBeenCalledTimes(1);
      expect(redisStub.quit).not.toHaveBeenCalled();
      expect(redisClientStore.client).toBeNull();
    });

    it("does nothing if there is no redis client and no callback specified", () => {
      closeRedisClient();
      expect(redisStub.quit).not.toHaveBeenCalled();
      expect(redisClientStore.client).toBeNull();
    });
  });
});
