const playlistModel = require('../../../../DB/models/playlist.model')

const getPlayList = async (req, res) => {
    const userId = req.userData._id // get userId from middleware authorization

    try {
        // Fetch all playlists of the user
        const allPlaylists = await playlistModel.find({ userId }).select('-password').sort({ _id: -1 })

        return res.json({
            message: 'Playlist fetched successfully',
            allPlaylists
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = getPlayList;