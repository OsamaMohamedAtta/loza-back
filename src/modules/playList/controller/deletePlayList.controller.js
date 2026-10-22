const userModel = require('../../../../DB/models/user.model')
const playlistModel = require('../../../../DB/models/playlist.model')

const deletePlayList = async (req, res) => {
    const { id } = req.params;  // Get playlist ID from URL parameters
    const userId = req.userData._id // get userId from middleware authorization

    try {
        // Find the user by userId (already verified by middleware)
        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find the playlist by ID and ensure it belongs to the authenticated user
        const playlist = await playlistModel.findById(id);

        if (!playlist) {
            return res.status(404).json({ message: 'Playlist not found' });
        }

        if (playlist.userId.toString() !== user._id.toString()) {
            return res.status(403).json({ message: 'You do not have permission to delete this playlist' });
        }

        // Remove the playlist ID from the user's playlists array
        user.playlists = user.playlists.filter((playlistId) => playlistId.toString() !== id);
        await user.save();

        // Delete the playlist from the database
        await playlistModel.findByIdAndDelete(id);

        // Fetch all playlists of the user
        const allPlaylists = await playlistModel.find({ userId: user._id }).select('-password').sort({ _id: -1 })

        return res.json({
            message: 'Playlist deleted successfully',
            allPlaylists
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = deletePlayList;