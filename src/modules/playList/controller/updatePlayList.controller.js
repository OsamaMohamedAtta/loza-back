const userModel = require('../../../../DB/models/user.model')
const playlistModel = require('../../../../DB/models/playlist.model')

const updatePlayList = async (req, res) => {
    const { name, url, password } = req.body;
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
            return res.status(403).json({ message: 'You do not have permission to update this playlist' });
        }

        // Determine if the playlist is password protected
        let isProtected = false;
        if (password != "") {
            isProtected = true;
        }

        // Update playlist details
        playlist.name = name || playlist.name;
        playlist.url = url || playlist.url;
        playlist.password = isProtected ? password : undefined;  // Store the password if it's set
        playlist.isProtected = isProtected;  // Set password protection flag

        // Save the updated playlist
        await playlist.save();

        // Fetch all playlists of the user
        const allPlaylists = await playlistModel.find({ userId: user._id }).select('-password').sort({ _id: -1 })

        // Return success response with updated playlist
        return res.json({
            message: 'Playlist updated successfully',
            allPlaylists,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = updatePlayList