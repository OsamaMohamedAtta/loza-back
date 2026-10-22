const userModel = require('../../../../DB/models/user.model')
const playlistModel = require('../../../../DB/models/playlist.model')

const addPlayList = async (req, res) => {
    const { name, url, password } = req.body; 
    const userId = req.userData._id // get userId from middleware authorization

    try {
        // Find the user by userId (already verified by middleware)
        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Determine if the playlist is password protected
        let isProtected = false;
        if(password != "") {
            isProtected = true;
        }

        // Check if the user has any playlists using the user's playlists array
        const isActive = user.playlists.length === 0; // Set active if no playlists exist

        // Create the new playlist
        const newPlaylist = new playlistModel({
            name,
            url,
            password: isProtected ? password : undefined,  // If no password provided, it will be saved as undefined
            isProtected,
            isActive,
            userId: user._id,  // Assign the playlist to the user
        });

        // Save the new playlist to the database
        await newPlaylist.save();

        // Add the new playlist's ID to the user's playlists array
        user.playlists.push(newPlaylist._id);
        await user.save();

        // Fetch all playlists of the user
        const allPlaylists = await playlistModel.find({ userId: user._id }).select('-password').sort({ _id: -1 })

        return res.json({
            message: 'Playlist added successfully',
            allPlaylists,
            playlist: newPlaylist
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = addPlayList;