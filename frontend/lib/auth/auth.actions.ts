"use server";

import { account } from "@/lib/appwrite";
import { ID } from "appwrite";

export async function sendOTP(email: string) {
  try {
    // Create email token - Appwrite returns correct userId (new or existing)
    const token = await account.createEmailToken(ID.unique(), email);
    console.log('Email token created, userId:', token.userId);
    
    return { 
      success: true, 
      userId: token.userId  // Use Appwrite's returned userId, not our generated one
    };
  } catch (error: any) {
    console.error('SendOTP error:', error);
    return { error: error.message || "Failed to send OTP", success: false };
  }
}

export async function verifyOTP(userId: string, otp: string) {
  try {
    console.log('Verifying userId:', userId, 'with OTP:', otp);
    
    if (!userId || !otp) {
      return { success: false, error: "Missing userId or OTP" };
    }
    
    const session = await account.createSession(userId, otp);
    console.log('Session created successfully:', session);
    
    return { success: true, session };
  } catch (error: any) {
    console.error('VerifyOTP error:', error);
    return { success: false, error: error.message || "Invalid OTP" };
  }
}

export async function logOut() {
  try {
    await account.deleteSession('current');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

