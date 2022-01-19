const router = require('express').Router()

// ℹ️ Handles password encryption
const bcrypt = require('bcrypt')
const mongoose = require('mongoose')

// How many rounds should bcrypt run the salt (default [10 - 12 rounds])
const saltRounds = 10

// Require the User model in order to interact with the database
const User = require('../models/User.model')
const Session = require('../models/Session.model')

// Require necessary (isLoggedOut and isLiggedIn) middleware in order to control access to specific routes
const isLoggedOut = require('../middleware/isLoggedOut')
const isLoggedIn = require('../middleware/isLoggedIn')

router.get('/session', async (req, res) => {
  // we dont want to throw an error, and just maintain the user as null
  if (!req.headers.authorization) {
    return res.json(null)
  }

  // accessToken is being sent on every request in the headers
  const accessToken = req.headers.authorization

  const session = await Session.findById(accessToken).populate('user')
  if (!session) {
    return res.status(404).json({ errorMessage: 'Session does not exist' })
  }
  return res.status(200).json(session)
})

router.post('/signup', isLoggedOut, async (req, res) => {
  const { email, name, lastName, password, phone, isLandlord } = req.body

  try {
    // Check if all fields are filled properly
    if (!email || !name || !lastName || !password || !phone) {
      return res
        .status(400)
        .json({ errorMessage: 'Please provide all the data.' })
    }

    if (password.length < 8) {
      return res.status(400).json({
        errorMessage: 'Your password needs to be at least 8 characters long.',
      })
    }

    //   ! This use case is using a regular expression to control for special characters and min length
    const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/

    if (!regex.test(password)) {
      return res.status(400).json({
        errorMessage:
          'Password needs to have at least 8 chars and must contain at least one number, one lowercase and one uppercase letter.',
      })
    }

    //Check if the email is already in use
    const userCheck = await User.findOne({ email })
    if (userCheck) {
      return res.status(400).json({ errorMessage: 'email already in use.' })
    }

    //Generate salt and hash password
    const salt = await bcrypt.genSalt(saltRounds)
    const hashedPassword = await bcrypt.hash(password, salt)

    //Then create user and session
    const user = await User.create({
      email,
      name,
      lastName,
      password: hashedPassword,
      phone,
      isLandlord,
    })

    const session = await Session.create({
      user: user._id,
      createdAt: Date.now(),
    })

    res.status(201).json({ user, accessToken: session._id })
  } catch (err) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ errorMessage: error.message })
    }
    if (error.code === 11000) {
      return res.status(400).json({
        errorMessage: 'This email you is already in use.',
      })
    }
    return res.status(500).json({ errorMessage: error.message })
  }
})

router.post('/login', isLoggedOut, async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email) {
      return res
        .status(400)
        .json({ errorMessage: 'Please provide your email.' })
    }

    // Here we use the same logic as above
    // - either length based parameters or we check the strength of a password
    if (password.length < 8) {
      return res.status(400).json({
        errorMessage: 'Your password needs to be at least 8 characters long.',
      })
    }

    // Search the database for a user with the email submitted in the form
    const user = await User.findOne({ email })

    // If the user isn't found, send the message that user provided wrong credentials
    if (!user) {
      return res.status(400).json({ errorMessage: 'Wrong credentials.' })
    }

    // If user is found based on the email, check if the in putted password matches the one saved in the database
    const isSamePassword = await bcrypt.compare(password, user.password)
    if (!isSamePassword) {
      return res.status(400).json({ errorMessage: 'Wrong credentials.' })
    }

    const session = await Session.create({
      user: user._id,
      createdAt: Date.now(),
    })
    return res.json({ user, accessToken: session._id })
  } catch (err) {
    // in this case we are sending the error handling to the error handling middleware that is defined in the error handling file
    // you can just as easily run the res.status that is commented out below
    next(err)
    // return res.status(500).render("login", { errorMessage: err.message });
  }
})

router.delete('/logout', isLoggedIn, async (req, res) => {
  try {
    await Session.findByIdAndDelete(req.headers.authorization)
    res.status(200).json({ message: 'User was logged out' })
  } catch (err) {
    console.log(err)
    res.status(500).json({ errorMessage: err.message })
  }
})

module.exports = router
