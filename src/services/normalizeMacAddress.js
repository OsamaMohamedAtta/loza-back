function normalizeMacAddress(mac) {
    if (mac.includes(":")) {
        return mac;
    }
    return mac.match(/.{1,2}/g).join(':');
}

module.exports = normalizeMacAddress;