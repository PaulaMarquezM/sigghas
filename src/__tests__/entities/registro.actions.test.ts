import { describe, it, expect, vi, beforeEach } from "vitest";

const redirectMock = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});
vi.mock("next/navigation", () => ({ redirect: (path: string) => redirectMock(path) }));

import { register } from "@/app/registro/actions";

describe("registro actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("register: bloquea el auto-registro y redirige a instrucciones", async () => {
    await expect(register()).rejects.toThrow(/NEXT_REDIRECT:\/registro\?error=/);
  });
});
