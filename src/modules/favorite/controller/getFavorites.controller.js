const favoriteModel = require('../../../../DB/models/favorite.model')

const getFavorites = async (req, res) => {
    try {
        // Get type from query parameters
        const { userId, type, playlistLink } = req.query;

        // Find favorites in the database that match userId and type
        const favorites = await favoriteModel.find({ userId, type, playlistLink }).select('-userId');

        // If no items in favorite list, return a 404 error
        if (favorites.length == 0) return res.status(404).json({ message: 'There is any items in favorite list yet' });

        res.json({ message: "Successfully fetched", favorites });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

module.exports = getFavorites