
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function POST() {
    try {
        const memoriesDir = path.join(process.cwd(), 'public', 'memories');

        if (!fs.existsSync(memoriesDir)) {
            return NextResponse.json({ error: `Directory not found: ${memoriesDir}` }, { status: 404 });
        }

        const dirs = fs.readdirSync(memoriesDir);
        let totalAdded = 0;
        let totalSkipped = 0;

        const logs: string[] = [];
        logs.push(`Found ${dirs.length} folders in /public/memories`);

        for (const dirName of dirs) {
            const dirPath = path.join(memoriesDir, dirName);
            const stats = fs.statSync(dirPath);

            if (stats.isDirectory()) {
                const room = await prisma.room.findUnique({
                    where: { slug: dirName }
                });

                if (!room) {
                    logs.push(`⚠️ Room not found for folder: "${dirName}". Skipping.`);
                    continue;
                }

                logs.push(`✅ Found room for folder: "${dirName}" (ID: ${room.id})`);

                // Get all existing media for this room to check against
                const existingMedia = await prisma.media.findMany({
                    where: {
                        roomId: room.id,
                        url: { startsWith: `/memories/${dirName}/` }
                    },
                    select: { url: true }
                });

                const existingUrls = new Set(existingMedia.map(m => m.url));
                const files = fs.readdirSync(dirPath);

                const newMediaItems = [];

                for (const file of files) {
                    if (file.startsWith('.')) continue;

                    const ext = path.extname(file).toLowerCase();
                    let type = 'image';
                    if (['.mp4', '.mov', '.webm'].includes(ext)) {
                        type = 'video';
                    } else if (!['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
                        logs.push(`   - Skipping unknown file type: ${file}`);
                        continue;
                    }

                    const relativePath = `/memories/${dirName}/${file}`;

                    if (!existingUrls.has(relativePath)) {
                        newMediaItems.push({
                            roomId: room.id,
                            url: relativePath,
                            type: type
                        });
                        logs.push(`   + Prepared to add: ${file}`);
                    } else {
                        // logs.push(`   = Exists: ${file}`);
                        totalSkipped++;
                    }
                }

                if (newMediaItems.length > 0) {
                    try {
                        const result = await prisma.media.createMany({
                            data: newMediaItems,
                            skipDuplicates: true
                        });
                        totalAdded += result.count;
                        logs.push(`   ✨ Batch inserted ${result.count} items.`);
                    } catch (error) {
                        console.error(`Error batch inserting for ${dirName}:`, error);
                        logs.push(`   ❌ Error batch inserting for ${dirName}: ${error}`);
                    }
                } else {
                    logs.push(`   - No new items to insert.`);
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Sync complete! Added: ${totalAdded}, Skipped: ${totalSkipped}`,
            added: totalAdded,
            skipped: totalSkipped,
            logs
        });

    } catch (error) {
        console.error('Sync error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
