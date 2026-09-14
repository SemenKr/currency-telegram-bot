import { describe, expect, it, vi } from "vitest";

import {
  type BotMessageCallback,
  createTelegramWebhookHandler,
} from "./handler.ts";

const expectedSecret = "test-telegram-webhook-secret";
const endpoint = "http://localhost/functions/v1/telegram-webhook";
const secretHeader = "X-Telegram-Bot-Api-Secret-Token";

const createSubject = () => {
  const callback = vi.fn<BotMessageCallback>().mockResolvedValue(undefined);
  const handler = createTelegramWebhookHandler(expectedSecret, callback);

  return { callback, handler };
};

const createPostRequest = (
  body: string,
  secret: string | null = expectedSecret,
) => {
  const headers = new Headers({ "Content-Type": "application/json" });

  if (secret !== null) {
    headers.set(secretHeader, secret);
  }

  return new Request(endpoint, { method: "POST", headers, body });
};

const expectJsonContentType = (response: Response) => {
  expect(response.headers.get("Content-Type")).toBe("application/json");
};

describe("Supabase Telegram webhook handler", () => {
  it("rejects non-POST methods", async () => {
    const { callback, handler } = createSubject();
    const response = await handler(new Request(endpoint));

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("POST");
    expectJsonContentType(response);
    await expect(response.json()).resolves.toEqual({
      error: "Method Not Allowed",
    });
    expect(callback).not.toHaveBeenCalled();
  });

  it("rejects POST without the Telegram secret before parsing the body", async () => {
    const { callback, handler } = createSubject();
    const response = await handler(createPostRequest("{", null));

    expect(response.status).toBe(401);
    expectJsonContentType(response);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(callback).not.toHaveBeenCalled();
  });

  it("rejects POST with an incorrect Telegram secret before parsing the body", async () => {
    const { callback, handler } = createSubject();
    const response = await handler(createPostRequest("{", "wrong-secret"));

    expect(response.status).toBe(401);
    expectJsonContentType(response);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(callback).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON", async () => {
    const { callback, handler } = createSubject();
    const response = await handler(createPostRequest("{"));

    expect(response.status).toBe(400);
    expectJsonContentType(response);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid Telegram update",
    });
    expect(callback).not.toHaveBeenCalled();
  });

  it("rejects an object without update_id", async () => {
    const { callback, handler } = createSubject();
    const response = await handler(createPostRequest("{}"));

    expect(response.status).toBe(400);
    expectJsonContentType(response);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid Telegram update",
    });
    expect(callback).not.toHaveBeenCalled();
  });

  it("acknowledges an update without a message", async () => {
    const { callback, handler } = createSubject();
    const response = await handler(createPostRequest('{"update_id":1}'));

    expect(response.status).toBe(200);
    expectJsonContentType(response);
    await expect(response.json()).resolves.toEqual({ ok: true, studentId: 5966 });
    expect(callback).not.toHaveBeenCalled();
  });

  it("acknowledges a non-text message without invoking the callback", async () => {
    const { callback, handler } = createSubject();
    const response = await handler(
      createPostRequest(
        JSON.stringify({
          update_id: 1,
          message: { message_id: 2, chat: { id: 123 } },
        }),
      ),
    );

    expect(response.status).toBe(200);
    expectJsonContentType(response);
    await expect(response.json()).resolves.toEqual({ ok: true, studentId: 5966 });
    expect(callback).not.toHaveBeenCalled();
  });

  it("invokes the callback for a text message", async () => {
    const { callback, handler } = createSubject();
    const response = await handler(
      createPostRequest(
        JSON.stringify({
          update_id: 1,
          message: { message_id: 2, chat: { id: 123 }, text: "EUR" },
        }),
      ),
    );

    expect(response.status).toBe(200);
    expectJsonContentType(response);
    await expect(response.json()).resolves.toEqual({ ok: true, studentId: 5966 });
    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith(123, "EUR");
  });

  it("returns a safe error when the callback fails", async () => {
    const callback = vi.fn<BotMessageCallback>().mockRejectedValue(
      new Error("internal details"),
    );
    const handler = createTelegramWebhookHandler(expectedSecret, callback);
    const response = await handler(
      createPostRequest(
        JSON.stringify({
          update_id: 1,
          message: { message_id: 2, chat: { id: 123 }, text: "EUR" },
        }),
      ),
    );

    expect(response.status).toBe(500);
    expectJsonContentType(response);
    await expect(response.json()).resolves.toEqual({ ok: false });
    expect(callback).toHaveBeenCalledWith(123, "EUR");
  });
});
