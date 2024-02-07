const vgd = require('vgd');
const isgd = require('isgd');

const primaryURL = "https://google-webb.replit.app";

async function shortenUrlOp(originalUrl) {
    return new Promise((resolve, reject) => {
        vgd.shorten(originalUrl, (res) => {
            resolve(res);
        });
    });
}

async function createShortLink(longUrl) {
    return new Promise((resolve, reject) => {
        isgd.shorten(longUrl, (shortUrl) => {
            if (shortUrl) {
                resolve(shortUrl);
            } else {
                reject(new Error('Failed to shorten the URL'));
            }
        });
    });
}

module.exports = {
    primaryURL,
    shortenUrlOp,
    createShortLink,
};
