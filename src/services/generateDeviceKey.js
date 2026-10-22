const crypto = require('crypto')

const generateDeviceKey = () => {
    // Generating a random number between 100000 and 999999
    return crypto.randomInt(100000, 999999).toString();
};

module.exports = generateDeviceKey;