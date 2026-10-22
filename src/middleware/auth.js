const userModel = require('../../DB/models/user.model')
const adminModel = require('../../DB/models/admin.model')
const resellerModel = require('../../DB/models/reseller.model')
const jwt = require('jsonwebtoken');

const isUser = async (req, res, next) => {
    try {
        const { authorization } = req.headers;

        if (!authorization) {
            return res.status(401).json({ message: 'Access token is missing' });
        }

        if (!authorization.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Invalid authorization format' });
        }

        const userToken = authorization.replace('Bearer ', '');

        const { id } = jwt.verify(userToken, process.env.TOKEN_SECRET_KEY);

        const user = await userModel.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.isSubscribed && !user.isTrialActive) {
            return res.status(403).json({ message: 'This user is not subscription' });
        }

        if (user.role !== 'User') {
            return res.status(403).json({ message: 'You do not have permission to perform this operation' });
        }

        req.userData = user;

        next();

    } catch (error) {
        return res.status(401).json({
            message: 'Invalid or expired token'
        });
    }
};

// Same as isUser but also lets in users whose subscription or trial has ended,
// so they can see their status and pay (used by the payment routes only)
const isUserAccount = async (req, res, next) => {
    try {
        const { authorization } = req.headers;

        if (!authorization) {
            return res.status(401).json({ message: 'Access token is missing' });
        }

        if (!authorization.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Invalid authorization format' });
        }

        const userToken = authorization.replace('Bearer ', '');

        const { id } = jwt.verify(userToken, process.env.TOKEN_SECRET_KEY);

        const user = await userModel.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'User') {
            return res.status(403).json({ message: 'You do not have permission to perform this operation' });
        }

        req.userData = user;

        next();

    } catch (error) {
        return res.status(401).json({
            message: 'Invalid or expired token'
        });
    }
};

const isAdmin = async (req, res, next) => {
    try {
        const { authorization } = req.headers;

        if (!authorization) {
            return res.status(401).json({ message: 'Access token is missing' });
        }

        if (!authorization.startsWith(process.env.AUTH_SECRET_KEY)) {
            return res.status(401).json({ message: 'Invalid auth secret key' });
        }

        const userToken = authorization.replace(process.env.AUTH_SECRET_KEY, '');
        const { id } = jwt.verify(userToken, process.env.TOKEN_SECRET_KEY);

        const user = await adminModel.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'Admin') {
            return res.status(403).json({ message: 'You do not have permission to perform this operation' });
        }

        req.userData = user;
        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const isReseller = async (req, res, next) => {
    try {
        const { authorization } = req.headers;

        if (!authorization) {
            return res.status(401).json({ message: 'Access token is missing' });
        }

        if (!authorization.startsWith(process.env.AUTH_SECRET_KEY)) {
            return res.status(401).json({ message: 'Invalid auth secret key' });
        }

        const userToken = authorization.replace(process.env.AUTH_SECRET_KEY, '');
        const { id } = jwt.verify(userToken, process.env.TOKEN_SECRET_KEY);

        const user = await resellerModel.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.block) {
            return res.status(403).json({ message: 'This account is blocked' });
        }

        if (user.role !== 'Reseller') {
            return res.status(403).json({ message: 'You do not have permission to perform this operation' });
        }

        req.userData = user;
        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const isSubReseller = async (req, res, next) => {
    try {
        const { authorization } = req.headers;

        if (!authorization) {
            return res.status(401).json({ message: 'Access token is missing' });
        }

        if (!authorization.startsWith(process.env.AUTH_SECRET_KEY)) {
            return res.status(401).json({ message: 'Invalid auth secret key' });
        }

        const userToken = authorization.replace(process.env.AUTH_SECRET_KEY, '');
        const { id } = jwt.verify(userToken, process.env.TOKEN_SECRET_KEY);

        const user = await resellerModel.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.block) {
            return res.status(403).json({ message: 'This account is blocked' });
        }

        if (user.role !== 'Reseller' && user.role !== 'subReseller') {
            return res.status(403).json({ message: 'You do not have permission to perform this operation' });
        }

        req.userData = user;
        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { isUser, isUserAccount, isAdmin, isReseller, isSubReseller }