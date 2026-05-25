"use server";

import { account } from "@/lib/appwrite";
import { ID } from "appwrite";

export async function sendOTP(email) {
  try {
    // Create email token - Appwrite returns correct userId (new or existing)
    const token = await account.createEmailToken(ID.unique(), email);
    console.log('Email token created, userId:', token.userId);

    return {
      success: true,
      userId: token.userId // Use Appwrite's returned userId, not our generated one
    };
  } catch (error) {
    console.error('SendOTP error:', error);
    return { error: error.message || "Failed to send OTP", success: false };
  }
}

export async function verifyOTP(userId, otp) {
  try {
    console.log('Verifying userId:', userId, 'with OTP:', otp);

    if (!userId || !otp) {
      return { success: false, error: "Missing userId or OTP" };
    }

    // Delete any existing active session before creating a new one.
    // Appwrite throws "Creation of a session is prohibited when a session is active"
    // if a session already exists, so we clear it first.
    try {
      await account.deleteSession('current');
      console.log('Existing session deleted before OTP verification');
    } catch (_) {
      // No active session to delete — this is fine, continue
    }

    const session = await account.createSession(userId, otp);
    console.log('Session created successfully:', session);

    return { success: true, session };
  } catch (error) {
    console.error('VerifyOTP error:', error);
    return { success: false, error: error.message || "Invalid OTP" };
  }
}

export async function logOut() {
  try {
    await account.deleteSession('current');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}