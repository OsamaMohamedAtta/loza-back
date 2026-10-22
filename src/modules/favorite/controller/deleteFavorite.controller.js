const favoriteModel = require('../../../../DB/models/favorite.model')

const deleteFavorite = async (req, res) => {
    try {
        // Get the favorite ID from URL parameters
        const { id } = req.params;

        // Attempt to find and delete the favorite item by its ID
        const favorite = await favoriteModel.findByIdAndDelete(id).select('-userId');

        // If no favorite is found, return a 404 error
        if (!favorite) return res.status(404).json({ message: 'Favorite not found' });

        res.json({ message: "Item deleted successfully", favorite });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

module.exports = deleteFavorite