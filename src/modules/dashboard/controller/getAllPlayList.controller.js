const playlistModel = require('../../../../DB/models/playlist.model')

const getAllPlayList = async (req, res) => {
    const { page = 1 } = req.query; // Get page query params
    const limit = 20; // Number of items per page
    const skip = (page - 1) * limit; // Calculate number of items to skip

    try {
        // Get all user's playlists
        const playlists = await playlistModel.find().sort({ _id: -1 }).skip(skip).limit(limit).populate({
            path: 'userId', // Populate user field
            select: 'macAddress type' 
        });

        // If there are no playlists in the date range
        if (playlists.length === 0) {
            return res.status(404).json({ message: 'No playlists found yet' });
        }

        const totalPlaylists = await playlistModel.countDocuments(); // Get total playlists

        return res.json({
            message: 'Playlists retrieved successfully',
            playlists,
            page: parseInt(page),
            totalPages: Math.ceil(totalPlaylists / limit),
            totalItems: totalPlaylists,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = getAllPlayList;