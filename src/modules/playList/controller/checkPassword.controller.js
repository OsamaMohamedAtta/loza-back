const playlistModel = require('../../../../DB/models/playlist.model')

const checkPassword = async (req, res) => {
    const { id } = req.params;  // Playlist ID from URL parameters
    const { password } = req.body;  

    try {
        // Find the playlist by ID
        const playlist = await playlistModel.findById(id);

        if (!playlist) {
            return res.status(404).json({ message: 'Playlist not found' });
        }

        // Check if the playlist is password-protected
        if (!playlist.isProtected) {
            return res.status(400).json({ message: 'Playlist is not password protected' });
        }

        // If the playlist is password-protected, check if the provided password matches
        if (password && password === playlist.password) {
            return res.json({ message: 'Password is correct' });
        }

        // If the password is incorrect or not provided
        return res.status(400).json({ message: 'Incorrect password' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = checkPassword