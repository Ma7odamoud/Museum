import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function syncMedia() {
    const memoriesDir = path.join(process.cwd(), 'public', 'memories');

    if (!fs.existsSync(memoriesDir)) {
        console.error(`Directory not found: ${memoriesDir}`);
        return;
    }

    const dirs = fs.readdirSync(memoriesDir);
    let totalAdded = 0;
    let totalSkipped = 0;

    for (const dirName of dirs) {
        const dirPath = path.join(memoriesDir, dirName);
        const stats = fs.statSync(dirPath);

        if (stats.isDirectory()) {
            console.log(`Checking folder: ${dirName}`);

            const room = await prisma.room.findUnique({
                where: { slug: dirName }
            });

            if (!room) {
                console.warn(`Room not found for slug: ${dirName}. Skipping.`);
                continue;
            }

            const files = fs.readdirSync(dirPath);

            for (const file of files) {
                if (file.startsWith('.')) continue; // Skip hidden files

                const ext = path.extname(file).toLowerCase();
                let type = 'image';
                if (['.mp4', '.mov', '.webm'].includes(ext)) {
                    type = 'video';
                } else if (!['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
                    console.warn(`Unknown file type: ${file}. Skipping.`);
                    continue;
                }

                const relativePath = `/memories/${dirName}/${file}`;

                try {
                    const result = await prisma.media.upsert({
                        where: { url: relativePath },
                        update: {}, // No updates needed if it exists
                        create: {
                            roomId: room.id,
                            url: relativePath,
                            type: type
                        }
                    });

                    if (result.createdAt > new Date(Date.now() - 1000)) { // Just created
                        console.log(`Added: ${relativePath}`);
                        totalAdded++;
                    } else {
                        // console.log(`Exists: ${relativePath}`);
                        totalSkipped++;
                    }

                } catch (error) {
                    console.error(`Error syncing ${relativePath}:`, error);
                }
            }
        }
    }

    console.log(`Sync complete! Added: ${totalAdded}, Skipped (Already Exists): ${totalSkipped}`);
}

syncMedia()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
