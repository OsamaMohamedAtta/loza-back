const favoriteRouter = require('express').Router()
const addToFavorite = require('./controller/addToFavorite.controller')
const getFavorites = require('./controller/getFavorites.controller')
const deleteFavorite = require('./controller/deleteFavorite.controller')

favoriteRouter.post('/favorite/add', addToFavorite)
favoriteRouter.get('/favorite/get', getFavorites)
favoriteRouter.delete('/favorite/delete/:id', deleteFavorite)

module.exports = favoriteRouter