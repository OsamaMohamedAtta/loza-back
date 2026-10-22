const playlistModel = require('../../../../DB/models/playlist.model');
const userModel = require('../../../../DB/models/user.model');

const activePlayList = async (req, res) => {
    const { id } = req.params;  // Playlist ID from URL parameters

    try {
        const playlist = await playlistModel.findById(id);

        if (!playlist) {
            return res.status(404).json({ message: 'Playlist not found' });
        }

        // Activate the selected playlist
        playlist.isActive = true;
        await playlist.save();

        // Fetch all playlists of the user who owns this playlist
        const allPlaylists = await userModel.findById(playlist.userId).populate('playlists')

        // Iterate over all playlists to set them to inactive if they are not the activated playlist
        for (const userPlaylist of allPlaylists.playlists) {
            if (userPlaylist._id.toString() !== playlist._id.toString()) {
                userPlaylist.isActive = false;
                await userPlaylist.save();
            }
        }

        // Return the updated playlists
        res.json({ message: 'Playlist activated successfully', allPlaylists: allPlaylists.playlists });
    } catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
};

module.exports = activePlayList;