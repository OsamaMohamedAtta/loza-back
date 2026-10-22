const userModel = require('../../../../DB/models/user.model')
const playlistModel = require('../../../../DB/models/playlist.model')

const deleteFromApp = async (req, res) => {
    const { macAddress, playlistIds } = req.body; // playlist IDs

    if (!Array.isArray(playlistIds) || playlistIds.length === 0) {
        return res.status(400).json({ message: 'Please provide an array of playlist IDs to delete' });
    }

    try {
        // Find the user by macAddress
        const user = await userModel.findOne({ macAddress });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find playlists that match the IDs and belong to the user
        const playlists = await playlistModel.find({ _id: { $in: playlistIds } });

        // Check if all playlists exist
        const foundPlaylistIds = playlists.map(p => p._id.toString());
        const notFoundIds = playlistIds.filter(id => !foundPlaylistIds.includes(id));

        if (notFoundIds.length > 0) {
            return res.status(404).json({ message: `Playlists not found: ${notFoundIds.join(', ')}` });
        }

        // Verify ownership
        const unauthorizedPlaylists = playlists.filter(p => p.userId.toString() !== user._id.toString());
        if (unauthorizedPlaylists.length > 0) {
            return res.status(403).json({ message: 'You do not have permission to delete some of these playlists' });
        }

        // Remove playlist IDs from user's playlists array
        user.playlists = user.playlists.filter(
            (playlistId) => !playlistIds.includes(playlistId.toString())
        );
        await user.save();

        // Delete all specified playlists
        await playlistModel.deleteMany({ _id: { $in: playlistIds } });

        // Fetch remaining playlists
        const allPlaylists = await playlistModel.find({ userId: user._id }).select('-password').sort({ _id: -1 });

        return res.json({
            message: 'Playlists deleted successfully',
            allPlaylists
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = deleteFromApp;