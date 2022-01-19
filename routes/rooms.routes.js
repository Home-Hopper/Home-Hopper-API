const router = require('express').Router()
const mongoose = require('mongoose')
ObjectId = require('mongodb').ObjectId

const Room = require('../models/Room.model')
const User = require('../models/User.model')

// Require necessary (isLoggedIn) middleware in order to control access to specific routes
const isLoggedIn = require('../middleware/isLoggedIn')

// Cloudinary's config
const cloudinary = require('cloudinary')
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
})

router.get('/for-rent', async (req, res) => {
  const { location, price, isDouble } = req.query

  let min, max
  if (price) {
    min = price.split('-')[0]
    max = price.split('-')[1]
    if (!max) max = Infinity
  }

  try {
    const rooms = await Room.find({
      isAdActive: true,
      ...(location && { location }),
      ...(price && { price: { $gte: `${min}`, $lte: `${max}` } }),
      ...(isDouble && { isDouble }),
    })
    res.status(200).json({ rooms })
  } catch (err) {
    console.log('Error filtering rooms to send to the FrontEnd:', err)
  }
})

router.get('/for-rent/:id', async (req, res) => {
  const id = req.params.id
  try {
    const room = await Room.findById(id).populate('publishedBy')
    res.status(200).json({ room })
  } catch (err) {
    console.log(`Error getting this room: ${id}`, err)
  }
})

router.post('/your-rooms', async (req, res) => {
  const userId = req.body.id
  try {
    const userRooms = await Room.find({ publishedBy: userId })
    res.status(200).json({ userRooms })
  } catch (err) {
    console.log('Error loading your rooms page:', err)
  }
})

router.post('/create', isLoggedIn, async (req, res) => {
  const {
    image,
    location,
    title,
    description,
    publishedBy,
    price,
    isDouble,
    bathrooms,
    totalRooms,
    area,
    isAdActive,
    isRented,
  } = req.body

  if (!title || !publishedBy || !price || !bathrooms || !totalRooms || !area) {
    return res
      .status(400)
      .json({ errorMessage: 'Please provide all the data.' })
  }

  if (isNaN(price) || isNaN(bathrooms) || isNaN(totalRooms) || isNaN(area)) {
    return res.status(400).json({
      errorMessage:
        'Price, nº of bathrooms, nº of rooms and area must be numbers ',
    })
  }

  try {
    const room = await Room.create({
      image,
      title,
      location,
      description,
      publishedBy,
      price,
      isDouble,
      bathrooms,
      totalRooms,
      area,
      isAdActive,
      isRented,
    })
    await User.findByIdAndUpdate(publishedBy, { $push: { rooms: room._id } })
    return res.status(200).json(room)
  } catch (err) {
    console.log('Error during room creation:', err)
  }
})

router.put('/update', isLoggedIn, async (req, res) => {
  const {
    roomId,
    title,
    location,
    description,
    publishedBy,
    price,
    isDouble,
    bathrooms,
    totalRooms,
    area,
    isAdActive,
    isRented,
    oldImg,
    newImg,
  } = req.body

  try {
    //If there's a new photo delete the old one
    if(newImg) await cloudinary.v2.uploader.destroy(oldImg)

    //Then update with new one
    const updatedRoom = await Room.findByIdAndUpdate(
      roomId,
      {
        ...(newImg && { image: newImg }),
        title,
        location,
        description,
        publishedBy,
        price,
        isDouble,
        bathrooms,
        totalRooms,
        area,
        isAdActive,
        isRented,
      },
      { new: true }
    )

    return res.status(200).json(updatedRoom)
  } catch (err) {
    console.log('Error updating room:', err)
  }
})

router.put('/update-saved', async (req, res) => {
  const { userId, roomId } = req.body

  try {
    let userToUpdate = await User.findById(userId)

    if (userToUpdate.savedRooms.includes(roomId))
      userToUpdate = await User.findByIdAndUpdate(
        userId,
        {
          $pull: { savedRooms: roomId },
        },
        { new: true }
      )
    else
      userToUpdate = await User.findByIdAndUpdate(
        userId,
        {
          $push: { savedRooms: roomId },
        },
        { new: true }
      )

    return res.status(200).json({ user: userToUpdate })
  } catch (err) {
    console.log('Error updating saved rooms:', err)
  }
})

router.delete('/delete', isLoggedIn, async (req, res) => {
  try {
    const roomToDelete = await Room.findById(req.body.roomId)
    await User.findByIdAndUpdate(roomToDelete.publishedBy, {
      $pull: { rooms: roomToDelete._id },
    })
    const roomPhoto = roomToDelete.image
    if (roomPhoto !== '') {
      await cloudinary.v2.uploader.destroy(roomPhoto)
    }

    const deletedRoom = await Room.findByIdAndDelete(req.body.roomId)
    return res.status(200).json(deletedRoom)
  } catch (err) {
    console.log('Error during room deletion:', err)
  }
})

module.exports = router
