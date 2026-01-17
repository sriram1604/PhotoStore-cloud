"use server";

import connectToDatabase from "@/lib/db";
import { User } from "@/models/models";
import { auth } from "@clerk/nextjs/server";

export async function searchUsers(query: string) {
  const { userId } = await auth();
  if (!userId) return []; // Or throw error

  if (!query || query.length < 2) return [];

  await connectToDatabase();

  // Search by email or username, case-insensitive
  const users = await User.find({
    $and: [
      { clerkId: { $ne: userId } }, // Exclude self
      {
        $or: [
          { email: { $regex: query, $options: "i" } },
          { username: { $regex: query, $options: "i" } },
        ],
      },
    ],
  })
    .limit(5)
    .select("clerkId email username"); // Select only necessary fields

  return JSON.parse(JSON.stringify(users));
}
