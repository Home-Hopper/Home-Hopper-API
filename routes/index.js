const router = require('express').Router()
const authRoutes = require('./auth.routes')
const profileRoutes = require('./profile.routes')
const roomRoutes = require('./rooms.routes')
const Room = require('../models/Room.model')

/* GET home page */
router.get('/', async (req, res, next) => {
  try {
    const allRooms = await Room.find({})
    res.status(200).json({ allRooms })
  } catch (err) {
    console.log(err)
  }
})

router.use('/auth', authRoutes)
router.use('/profile', profileRoutes)
router.use('/rooms', roomRoutes)

module.exports = router
