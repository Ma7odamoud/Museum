import { createUploadthing, type FileRouter } from "uploadthing/next";
import { prisma } from "@/lib/prisma";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

// FileRouter for your app
export const ourFileRouter = {
    // Image uploader
    imageUploader: f({ image: { maxFileSize: "16MB" } })
        .middleware(async ({ req }) => {
            // Extract roomId from the URL search params
            const url = new URL(req.url);
            const roomId = url.searchParams.get("roomId");

            if (!roomId) {
                throw new UploadThingError("Room ID is required");
            }

            // Verify room exists
            const room = await prisma.room.findUnique({
                where: { id: roomId },
            });

            if (!room) {
                throw new UploadThingError("Room not found");
            }

            return { roomId };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            // Save to Prisma Media table
            const media = await prisma.media.create({
                data: {
                    roomId: metadata.roomId,
                    url: file.url,
                    type: "image",
                },
            });

            console.log("Image upload complete:", media);
            return { success: true, mediaId: media.id };
        }),

    // Video uploader
    videoUploader: f({ video: { maxFileSize: "256MB" } })
        .middleware(async ({ req }) => {
            // Extract roomId from the URL search params
            const url = new URL(req.url);
            const roomId = url.searchParams.get("roomId");

            if (!roomId) {
                throw new UploadThingError("Room ID is required");
            }

            // Verify room exists
            const room = await prisma.room.findUnique({
                where: { id: roomId },
            });

            if (!room) {
                throw new UploadThingError("Room not found");
            }

            return { roomId };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            // Save to Prisma Media table
            const media = await prisma.media.create({
                data: {
                    roomId: metadata.roomId,
                    url: file.url,
                    type: "video",
                },
            });

            console.log("Video upload complete:", media);
            return { success: true, mediaId: media.id };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
