import { describe, expect, it } from "vitest";

import { createTelegramWebhookHandler } from "./handler.ts";

const expectedSecret = "test-telegram-webhook-secret";
const endpoint = "http://localhost/functions/v1/telegram-webhook";

const handler = createTelegramWebhookHandler(expectedSecret);

describe("Supabase Telegram webhook handler", () => {
  it("rejects non-POST methods", async () => {
    const response = await handler(new Request(endpoint));

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("POST");
    expect(response.headers.get("Content-Type")).toBe("application/json");
    await expect(response.json()).resolves.toEqual({
      error: "Method Not Allowed",
    });
  });

  it("rejects POST without the Telegram secret", async () => {
    const response = await handler(
      new Request(endpoint, { method: "POST" }),
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    await expect(response.json()).resolves.toEqual({
      error: "Unauthorized",
    });
  });

  it("rejects POST with an incorrect Telegram secret", async () => {
    const response = await handler(
      new Request(endpoint, {
        method: "POST",
        headers: {
          "X-Telegram-Bot-Api-Secret-Token": "wrong-secret",
        },
      }),
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    await expect(response.json()).resolves.toEqual({
      error: "Unauthorized",
    });
  });

  it("accepts POST with the correct Telegram secret", async () => {
    const response = await handler(
      new Request(endpoint, {
        method: "POST",
        headers: {
          "X-Telegram-Bot-Api-Secret-Token": expectedSecret,
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      runtime: "supabase-edge",
      studentId: 5966,
    });
  });
});
