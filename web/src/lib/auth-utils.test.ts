import { describe, it, expect } from "vitest";
import { validatePassword } from "./auth-utils";

describe("validatePassword", () => {
  it("rejects empty string", () => {
    expect(validatePassword("")).toEqual({
      valid: false,
      error: "Password must be at least 8 characters",
    });
  });

  it("rejects 7-character password", () => {
    expect(validatePassword("Abcdef1")).toEqual({
      valid: false,
      error: "Password must be at least 8 characters",
    });
  });

  it("accepts exactly 8 characters with all requirements", () => {
    expect(validatePassword("Abcdef1x")).toEqual({ valid: true });
  });

  it("rejects password without uppercase", () => {
    expect(validatePassword("abcdefg1")).toEqual({
      valid: false,
      error: "Password must contain at least one uppercase letter",
    });
  });

  it("rejects password without lowercase", () => {
    expect(validatePassword("ABCDEFG1")).toEqual({
      valid: false,
      error: "Password must contain at least one lowercase letter",
    });
  });

  it("rejects password without digit", () => {
    expect(validatePassword("Abcdefgh")).toEqual({
      valid: false,
      error: "Password must contain at least one digit",
    });
  });

  it("accepts long valid password", () => {
    expect(validatePassword("MyStr0ngP@ssword123")).toEqual({ valid: true });
  });

  it("accepts password with special characters", () => {
    expect(validatePassword("P@ss!w0rd")).toEqual({ valid: true });
  });

  it("rejects all-digit password (no uppercase or lowercase)", () => {
    expect(validatePassword("12345678")).toEqual({
      valid: false,
      error: "Password must contain at least one uppercase letter",
    });
  });
});
