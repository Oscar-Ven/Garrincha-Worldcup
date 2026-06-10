import "server-only";

import crypto from "node:crypto";
import { cache } from "react";

import { Prisma, Role } from "@prisma/client";
import { compare, hash } from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { isPlaceholderValue } from "@/lib/app-mode";
import { prisma } from "@/lib/prisma";

const sessionCookieName = "garrincha_session";
const encoder = new TextEncoder();

type SessionPayload = {
  userId: string;
  role: Role;
};

function secret() {
  const value = process.env.JWT_SECRET ?? process.env.AUTH_SECRET;
  if (!value || value.length < 32 || isPlaceholderValue(value)) {
    throw new Error("JWT_SECRET must be set to a non-placeholder value with at least 32 characters.");
  }
  return encoder.encode(value);
}

export async function hashPassword(password: string) {
  return hash(password, 12);
}

export async function verifyPassword(password: string, hash: string | null): Promise<boolean> {
  if (hash === null) return false;
  return compare(password, hash);
}

export async function createSession(payload: SessionPayload, rememberMe = true) {
  const expiry = rememberMe ? "30d" : "1d";
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiry)
    .sign(secret());

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(rememberMe ? { maxAge: 60 * 60 * 24 * 30 } : {}),
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.userId !== "string") return null;
    if (payload.role !== Role.USER && payload.role !== Role.ADMIN && payload.role !== Role.CENTER_ADMIN && payload.role !== Role.SUPER_ADMIN) return null;
    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}

export const currentUserSelect = {
  id: true,
  email: true,
  displayName: true,
  fullName: true,
  nickname: true,
  nationality: true,
  phoneNumber: true,
  role: true,
  avatarUrl: true,
  competitionCenterId: true,
  competitionCenterLockedAt: true,
  firstActivatedAt: true,
  center: {
    select: {
      id: true,
      name: true,
      country: true,
      city: true,
      bannerUrl: true,
    },
  },
  competitionCenter: {
    select: {
      id: true,
      name: true,
      country: true,
      city: true,
    },
  },
} satisfies Prisma.UserSelect;

export const getCurrentUser = cache(async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  return prisma.user.findUnique({
    where: { id: session.userId },
    select: currentUserSelect,
  });
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Authentication required.");
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || (user.role !== Role.ADMIN && user.role !== Role.CENTER_ADMIN && user.role !== Role.SUPER_ADMIN)) throw new Error("Admin access required.");
  return user;
}

export async function requireSuperAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== Role.SUPER_ADMIN) throw new Error("Super admin access required.");
  return user;
}

export async function requireCenterAdmin() {
  const user = await getCurrentUser();
  if (!user || (user.role !== Role.ADMIN && user.role !== Role.CENTER_ADMIN && user.role !== Role.SUPER_ADMIN)) {
    throw new Error("Admin access required.");
  }
  return user;
}

export function canManageCenter(user: { role: string; centerId: string }, targetCenterId: string): boolean {
  if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") return true;
  if (user.role === "CENTER_ADMIN") return user.centerId === targetCenterId;
  return false;
}

export function generateAccessToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hash: tokenHash };
}

export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export const ACCESS_TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

export function isAccessTokenExpired(createdAt: Date | null, now: Date = new Date()): boolean {
  if (!createdAt) return true;
  return now.getTime() - createdAt.getTime() > ACCESS_TOKEN_EXPIRY_MS;
}
