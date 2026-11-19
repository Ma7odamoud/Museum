const ytpl = require('ytpl');

async function test() {
    try {
        const id = 'PLKi5ZRHdupzZuFngcFeRbs37D0TleRw3h';
        console.log("Fetching playlist Info for:", id);
        const playlist = await ytpl(id, { limit: 10 });
        console.log("Success! Items found:", playlist.items.length);
        console.log("Sample video:", playlist.items[0].title, playlist.items[0].id);
    } catch (e) {
        console.error("ytpl Error:", e.message);
    }
}
test();
