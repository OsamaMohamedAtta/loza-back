const playlistModel = require('../../../../DB/models/playlist.model')
const userModel = require('../../../../DB/models/user.model')

const getToApp = async (req, res) => {
    const { macAddress } = req.query;

    try {
        // Find the user by userId (already verified by middleware)
        const user = await userModel.findOne({ macAddress });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fetch all playlists of the user
        const playlists = await playlistModel.find({ userId: user._id }).select('-password')

        return res.json({
            message: 'Playlist fetched successfully',
            playlists
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = getToApp;