"use client";

import { createAuthClient } from "better-auth/react";

// Same-origin by default — no baseURL needed.
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
