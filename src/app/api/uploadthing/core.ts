import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/auth";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
// UploadThing is now RESERVED for resume PDFs ONLY. Every image/video surface
// (posts, messages, profile pictures, banners, job images, company logos) was
// migrated to Cloudinary (see src/lib/cloudinaryUpload.ts). The former image
// routes — bannerUploader, avatarUploader, postUploader, jobImageUploader,
// chatAttachment, companyLogo — have been removed so UploadThing can't be used
// for anything except resumes.
export const ourFileRouter = {
    resumeUploader: f({ pdf: { maxFileSize: "4MB", maxFileCount: 1 } })
        .middleware(async ({ req }) => {
            const session = await auth();
            if (!session || !session.user) throw new UploadThingError("Unauthorized");
            return { userId: session.user.id };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Resume upload complete for userId:", metadata.userId);
            return { uploadedBy: metadata.userId, url: file.url };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
