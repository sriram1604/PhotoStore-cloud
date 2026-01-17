import mongoose, { Schema, Document, Model } from "mongoose";

// --- User Schema ---
export interface IUser extends Document {
  clerkId: string;
  email: string;
  username?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  clerkId: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true },
  username: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const User = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>("User", UserSchema);


// --- Folder Schema ---
export interface IFolder extends Document {
  name: string;
  ownerId: string;
  parentFolderId?: mongoose.Types.ObjectId;
  path: string; // Materialized path: /root/parent/this
  isShared: boolean;
  sharedWith: { userId: string; role: "viewer" | "editor" }[]; // Array of Objects
  createdAt: Date;
}

const FolderSchema = new Schema<IFolder>({
  name: { type: String, required: true },
  ownerId: { type: String, required: true, index: true },
  parentFolderId: { type: Schema.Types.ObjectId, ref: "Folder", default: null },
  path: { type: String, default: "/" },
  isShared: { type: Boolean, default: false },
  sharedWith: {
    type: [
      {
        userId: { type: String, required: true },
        role: { type: String, enum: ["viewer", "editor"], default: "viewer" },
        _id: false 
      }
    ],
    default: []
  },
  createdAt: { type: Date, default: Date.now },
});

// Index for efficient folder browsing
FolderSchema.index({ ownerId: 1, parentFolderId: 1 });

// Prevent overwrite model error but allows hot reload of schema in dev
if (process.env.NODE_ENV !== "production" && mongoose.models.Folder) {
  delete mongoose.models.Folder;
}

export const Folder = (mongoose.models.Folder as Model<IFolder>) || mongoose.model<IFolder>("Folder", FolderSchema);


// --- Image Schema ---
export interface IImage extends Document {
  publicId: string;
  secureUrl: string;
  format: string;
  width: number;
  height: number;
  ownerId: string; // Clerk ID
  folderId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ImageSchema = new Schema<IImage>({
  publicId: { type: String, required: true },
  secureUrl: { type: String, required: true },
  format: { type: String, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  ownerId: { type: String, required: true, index: true },
  folderId: { type: Schema.Types.ObjectId, ref: "Folder", default: null },
  createdAt: { type: Date, default: Date.now },
});

ImageSchema.index({ ownerId: 1, folderId: 1 });

export const ImageModel = (mongoose.models.Image as Model<IImage>) || mongoose.model<IImage>("Image", ImageSchema);
