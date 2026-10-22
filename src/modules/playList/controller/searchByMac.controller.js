const playlistModel = require('../../../../DB/models/playlist.model')

// Function to normalize the macAddress
function normalizeMacAddress(mac) {
    if (mac.includes(":")) {
        return mac;
    }
    return mac.match(/.{1,2}/g).join(':');
}

const searchByMac = async (req, res) => {
    const { macAddress } = req.query; // Get MAC address from query params
    try {
        const normalizedMacAddress = normalizeMacAddress(macAddress);

        // Get all user's playlists filtered by macAddress
        const playlists = await playlistModel.find()
            .sort({ _id: -1 })
            .skip(0)
            .limit(20)
            .populate({
                path: 'userId', // Populate user field
                select: 'macAddress type',
                match: {
                    macAddress: { $regex: new RegExp(normalizedMacAddress, 'i') } // Case-insensitive regex match
                }
            });

        const filteredPlaylists = playlists.filter(playlist => playlist.userId);

        // If there are no playlists for the provided MAC address
        if (filteredPlaylists.length === 0) {
            return res.status(404).json({ message: 'No playlists found for the provided MAC address' });
        }

        res.json({
            message: 'Playlists retrieved successfully',
            playlists: filteredPlaylists
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = searchByMac;