"use server";

import { redis } from "../RedisServer";

type APIError = {
  error: string;
};

type APISuccess = {
  isProfanity: boolean;
  score: number;
  flaggedFor: string[] | undefined;
};

export const checkProfanity = async ({ message }: { message: string }) => {
  try {
    if (message.trim().split(/\s+/).length <= 1) {
      return { error: "Please enter a longer text, at least 2 words." };
    }

    if (message.trim().split(/\s+/).length > 35) {
      return {
        error:
          "Due to a current Cloudflare limit, we can only scan texts up to 35 words. I'm working on removing this limit.",
      };
    }

    const res = await fetch(`${process.env.PROFANITY_API}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    await redis.incr("serverd-api-requests");

    const json = await res.json();

    if (res.status === 429) {
      return { error: "Rate limit exceeded, please try again later." };
    }

    if (!res.ok) {
      const { error } = json as APIError;
      return { error };
    }

    return json as APISuccess;
  } catch (err) {
    return { error: "Something went wrong, please try again." };
  }
};
