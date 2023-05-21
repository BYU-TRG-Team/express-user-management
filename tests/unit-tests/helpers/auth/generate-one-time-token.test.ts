import { generateOneTimeToken } from "@helpers/auth";

describe("tests generateOneTimeToken method", () => {
  it("should generate a 16-byte token", () => {
    const token = generateOneTimeToken();
    expect(token).toHaveLength(32);
  });

  it("should generate a different token each time the method is invoked", () => {
    const token1 = generateOneTimeToken();
    const token2 = generateOneTimeToken();
    expect(token1).not.toStrictEqual(token2);
  });
});