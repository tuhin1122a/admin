import { db } from "./db";

export const createAdminVerificationToken = async (token: string) => {
  try {
    const existingToken = await db.emailVerificationToken.findFirst({
      where: {},
    });
    const expires: Date = new Date(Date.now() + 3600 * 1000);
    if (existingToken) {
      return await db.emailVerificationToken.update({
        where: { id: existingToken.id },
        data: {
          token,
          expire: expires,
        },
      });
    }

    return await db.emailVerificationToken.create({
      data: { token, expire: expires },
    });
  } catch {
    return null;
  }
};

export function generateOTP(length = 6) {
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp.toString();
}
