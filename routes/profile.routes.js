const router = require('express').Router()
const mongoose = require('mongoose')

const User = require('../models/User.model')
const Room = require('../models/Room.model')

router.get('/:id', async (req, res) => {
  const userId = req.params.id

  try {
    const user = await User.findById(userId).populate('savedRooms')
    const rooms = [...user.savedRooms]
    res.status(200).json(rooms)
  } catch (err) {
    console.log("Error getting user's saved rooms:", err)
  }
})

router.put('/update', async (req, res) => {
  const { userId, email, name, lastName, phone } = req.body

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        email,
        name,
        lastName,
        phone,
      },
      { new: true }
    )
    return res.status(200).json(updatedUser)
  } catch (err) {
    console.log('Error updating user:', err)
  }
})

module.exports = router
