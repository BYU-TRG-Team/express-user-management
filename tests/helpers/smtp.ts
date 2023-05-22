import VerificationEmail from "@emails/verification";
import { generateTestUser } from "./user";
import { getMockReq } from "@jest-mock/express";
import { generateTestToken } from "./token";

/**
 * Generates an email using fake data
 */
export const generateTestEmail = async () => {
  const user = await generateTestUser({
    saveToDb: false
  });
  const token = await generateTestToken({
    saveToDb: false
  });
  const req = getMockReq();
  const email = new VerificationEmail({
    req,
    user,
    token
  });

  return email;
};