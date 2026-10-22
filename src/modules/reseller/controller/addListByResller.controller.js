const userModel = require('../../../../DB/models/user.model')
const playlistModel = require('../../../../DB/models/playlist.model')
const normalizeMacAddress = require('../../../services/normalizeMacAddress')

const addListByReseller = async (req, res) => {
    const { macAddress, name, url, password } = req.body;

    try {
        // Validate input
        if (!macAddress || !name || !url) {
            return res.status(400).json({
                message: 'MAC address, name, and URL are required'
            });
        }

        // Normalize the MAC address for searching
        const normalizedMacAddress = normalizeMacAddress(macAddress);

        // Find user by MAC address
        const user = await userModel.findOne({ macAddress: normalizedMacAddress });

        if (!user) {
            return res.status(404).json({ message: 'User not found with this MAC address' });
        }

        // Determine if the playlist is password protected
        const isProtected = password && password.trim() !== "";

        // Check if this is the first playlist
        const isActive = user.playlists.length === 0;

        // Create the new playlist
        const newPlaylist = new playlistModel({
            name,
            url,
            password: isProtected ? password : undefined,
            isProtected,
            isActive,
            userId: user._id,
        });

        // Save the new playlist to the database
        await newPlaylist.save();

        // Add the new playlist's ID to the user's playlists array
        user.playlists.push(newPlaylist._id);
        await user.save();

        // Fetch all playlists of the user
        const allPlaylists = await playlistModel.find({ userId: user._id })
            .select('-password')
            .sort({ _id: -1 });

        return res.json({
            message: 'Playlist added successfully',
            allPlaylists,
            playlist: newPlaylist,
            user: {
                _id: user._id,
                macAddress: user.macAddress
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = addListByReseller;