const favoriteModel = require('../../../../DB/models/favorite.model')

const addToFavorite = async (req, res) => {
    // Get data from the request body
    const { userId, name, type, link, playlistLink } = req.body;

    // Create a new favorite instance
    const favorite = new favoriteModel({ userId, name, type, link, playlistLink })

    try {
        // Save the favorite to the database
        await favorite.save();

        res.json({ message: "Added to favorite successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

module.exports = addToFavorite