const generateProviderCode = () => {
    const chars = '0123456789'; // Only digits
    let result = '';
    for (let i = 0; i < 8; i++) { // Change 6 to 8 for an 8-digit code
        const randomIndex = Math.floor(Math.random() * chars.length);
        result += chars[randomIndex];
    }
    return result;
};

module.exports = generateProviderCode;