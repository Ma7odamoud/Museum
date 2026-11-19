const { createClient } = require('@supabase/supabase-js')
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
const mime = require('mime-types')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const prisma = new PrismaClient()

async function main() {
    const memoriesDir = path.join(process.cwd(), 'public', 'memories')

    if (!fs.existsSync(memoriesDir)) {
        console.error(`Directory not found: ${memoriesDir}`)
        return
    }

    const dirs = fs.readdirSync(memoriesDir)
    let totalUploaded = 0
    let totalUpdated = 0

    console.log(`Found ${dirs.length} folders in /public/memories\n`)

    for (const dirName of dirs) {
        const dirPath = path.join(memoriesDir, dirName)
        const stats = fs.statSync(dirPath)

        if (!stats.isDirectory()) continue

        const room = await prisma.room.findUnique({
            where: { slug: dirName }
        })

        if (!room) {
            console.log(`⚠️ Room not found for folder: "${dirName}". Skipping.`)
            continue
        }

        console.log(`=== Processing room: "${dirName}" ===`)
        const files = fs.readdirSync(dirPath)

        for (const file of files) {
            if (file.startsWith('.')) continue

            const filePath = path.join(dirPath, file)
            const relativeDbPath = `/memories/${dirName}/${file}`
            const storagePath = `${dirName}/${file}` // How it will be saved in Supabase bucket

            // 1. Check if this file exists in the database
            const mediaItem = await prisma.media.findFirst({
                where: {
                    roomId: room.id,
                    url: { contains: file }
                }
            })

            if (!mediaItem) {
                console.log(`   - Skipping ${file}: Not found in database`)
                continue
            }

            // 1.5 Check if it was already updated to the Supabase URL
            if (mediaItem.url.includes('supabase.co')) {
                console.log(`   ⏭ Skipping ${file}: Already uploaded to Supabase`)
                continue
            }

            // 2. Upload to Supabase Storage
            console.log(`   ⬆️ Uploading ${file}...`)
            const contentType = mime.lookup(filePath) || 'application/octet-stream'

            // For files > 2GB we must bypass fs.readFileSync.
            // Node 20+ supports fetch and Blob natively. We can stream it directly or convert to an ArrayBuffer.
            // Using a readStream converted to buffer is still limited to 2GB, so we use fetch directly to the Supabase API to stream the file.

            try {
                const stat = fs.statSync(filePath);
                const fileStream = fs.createReadStream(filePath);

                // Supabase JS client doesn't support streams in Node yet nicely without jumping through hoops, 
                // so we will manually upload it using fetch to their REST API.
                const uploadUrl = `${supabaseUrl}/storage/v1/object/memories/${storagePath}`;

                const response = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'Content-Type': contentType,
                        'x-upsert': 'true'
                    },
                    body: fileStream,
                    duplex: 'half' // Required by Node for streaming request bodies
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`   ❌ Failed to upload ${file}: HTTP ${response.status} - ${errorText}`);
                    continue;
                }

                totalUploaded++

                // 3. Update database with new Supabase URL
                const { data: publicUrlData } = supabase.storage
                    .from('memories')
                    .getPublicUrl(storagePath)

                await prisma.media.update({
                    where: { id: mediaItem.id },
                    data: { url: publicUrlData.publicUrl }
                })
                totalUpdated++
                console.log(`   ✅ Updated DB URL: ${publicUrlData.publicUrl}`)

            } catch (err) {
                console.error(`   ❌ Failed to upload ${file}:`, err)
            }
        }
    }

    console.log(`\n🎉 Migration Complete!`)
    console.log(`Total Files Uploaded: ${totalUploaded}`)
    console.log(`Total Database Records Updated: ${totalUpdated}`)
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect()
    })
