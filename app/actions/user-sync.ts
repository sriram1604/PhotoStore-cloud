"use server";

import connectToDatabase from "@/lib/db";
import { User } from "@/models/models";
import { currentUser } from "@clerk/nextjs/server";

export async function syncUser() {
  const user = await currentUser();
  if (!user) return null;
            
  await connectToDatabase();

  try {
    const existingUser = await User.findOne({ clerkId: user.id });
    
    if (!existingUser) {
       console.log("Syncing new user to DB:", user.id);
       await User.create({
          clerkId: user.id,
          email: user.emailAddresses[0].emailAddress,
          username: user.firstName ? `${user.firstName} ${user.lastName}` : "User",
       });
    }
    return true;
  } catch (error) {
      console.error("Failed to sync user", error);
      return false;
  }
}
