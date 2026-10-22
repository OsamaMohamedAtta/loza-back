const subscriptionModel = require('../../../../DB/models/subscription.model')
const playlistModel = require('../../../../DB/models/playlist.model')

const chanageHost = async (req, res) => {
    const { newHost, oldHost } = req.body; // oldHost optional
    const resellerId = req.userData._id;

    try {
        if (!newHost) return res.status(400).json({ message: 'newHost is required in body' });

        let newHostOrigin;
        try { newHostOrigin = new URL(newHost).origin; } catch (e) {
            return res.status(400).json({ message: 'Invalid newHost format' });
        }

        let oldHostOrigin = null;
        if (oldHost) {
            try { oldHostOrigin = new URL(oldHost).origin; } catch (e) {
                return res.status(400).json({ message: 'Invalid oldHost format' });
            }
        }

        // Find all subscriptions created by this reseller to get customer userIds
        const subscriptions = await subscriptionModel.find({ subscriptionBy: resellerId }).select('userId');
        const userIds = subscriptions.map(s => s.userId).filter(Boolean);

        if (!userIds.length) return res.status(404).json({ message: 'No customers found for this reseller' });

        // Find all playlists for these users
        const playlists = await playlistModel.find({ userId: { $in: userIds } });

        let updatedCount = 0;
        const updatedPlaylists = [];

        for (const pl of playlists) {
            if (!pl.url) continue;
            try {
                const newUrl = pl.url.replace(oldHost, newHost);

                pl.url = newUrl;
                await pl.save();
                updatedCount++;
                updatedPlaylists.push(pl._id);
            } catch (err) {
                // If URL parsing fails, skip this playlist
                continue;
            }
        }

        return res.json({ message: 'Host change completed', updated: updatedCount, updatedPlaylists });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = chanageHost;