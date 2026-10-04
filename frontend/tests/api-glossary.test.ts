import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../lib/api";

afterEach(() => vi.unstubAllGlobals());

describe("paper glossary API", () => {
  it("sends only the latest six turns from a long conversation", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ answer: "回答" }) });
    vi.stubGlobal("fetch", fetchMock);
    const history = Array.from({ length: 13 }, (_, index) => ({ question: `问题${index}`, answer: `回答${index}` }));

    await api.askPaperGlossary("7", "继续解释", history);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/backend-api/api/v1/papers/7/glossary/ask");
    expect(JSON.parse(options.body)).toEqual({ question: "继续解释", history: history.slice(-6) });
  });
});
