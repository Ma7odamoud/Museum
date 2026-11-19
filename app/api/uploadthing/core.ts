import { createUploadthing, type FileRouter } from "uploadthing/next";
import { prisma } from "@/lib/prisma";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

// FileRouter for your app
export const ourFileRouter = {
    // Image uploader — saves to Media table
    imageUploader: f({ image: { maxFileSize: "16MB" } })
        .middleware(async ({ req }) => {
            const url = new URL(req.url);
            const roomId = url.searchParams.get("roomId");

            if (!roomId) throw new UploadThingError("Room ID is required");

            const room = await prisma.room.findUnique({ where: { id: roomId } });
            if (!room) throw new UploadThingError("Room not found");

            return { roomId };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            const media = await prisma.media.create({
                data: { roomId: metadata.roomId, url: file.url, type: "image" },
            });
            console.log("Image upload complete:", media);
            return { success: true, mediaId: media.id };
        }),

    // Thumbnail uploader — uploads WebP thumbnails, returns URL only (no DB write; caller patches via /api/media/[id]/thumbnail)
    thumbnailUploader: f({ image: { maxFileSize: "2MB" } })
        .middleware(async () => {
            return {};
        })
        .onUploadComplete(async ({ file }) => {
            console.log("Thumbnail upload complete:", file.url);
            return { success: true, url: file.url };
        }),

    // Video uploader — saves to Media table
    videoUploader: f({ video: { maxFileSize: "256MB" } })
        .middleware(async ({ req }) => {
            const url = new URL(req.url);
            const roomId = url.searchParams.get("roomId");

            if (!roomId) throw new UploadThingError("Room ID is required");

            const room = await prisma.room.findUnique({ where: { id: roomId } });
            if (!room) throw new UploadThingError("Room not found");

            return { roomId };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            const media = await prisma.media.create({
                data: { roomId: metadata.roomId, url: file.url, type: "video" },
            });
            console.log("Video upload complete:", media);
            return { success: true, mediaId: media.id }
        }),

    // Cover image uploader — just returns the URL, no DB write (caller saves it)
    coverUploader: f({ image: { maxFileSize: "8MB" } })
        .middleware(async () => {
            return {}; // No auth needed beyond being on admin page
        })
        .onUploadComplete(async ({ file }) => {
            console.log("Cover upload complete:", file.url);
            return { success: true, url: file.url };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
