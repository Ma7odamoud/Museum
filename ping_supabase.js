const https = require('https');

const pathsToCheck = [
    '/memories/7bibty/IMG-20240911-WA0019.jpg',
    '/7bibty/IMG-20240911-WA0019.jpg',
    '/media/7bibty/IMG-20240911-WA0019.jpg',
];

const buckets = ['memories', 'public', 'media'];

console.log("Checking possible Supabase URLs...");

const checkUrl = (url) => {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            resolve({ url, status: res.statusCode });
        }).on('error', () => {
            resolve({ url, status: 'error' });
        });
    });
};

async function main() {
    const promises = [];
    for (const bucket of buckets) {
        for (const path of pathsToCheck) {
            const url = `https://yjwsrplqlkwoxywkgbxj.supabase.co/storage/v1/object/public/${bucket}${path}`;
            promises.push(checkUrl(url));
        }
    }

    const results = await Promise.all(promises);
    results.forEach(r => console.log(`${r.status} - ${r.url}`));
}

main();
