// ℹ️ Gets access to environment variables/settings
// https://www.npmjs.com/package/dotenv
require('dotenv/config')

// ℹ️ Connects to the database
require('./db')

// Handles http requests (express is node js framework)
// https://www.npmjs.com/package/express
const express = require('express')

const app = express()

// hola
const path = require('path')
app.use(express.static(path.join(__dirname, 'public')))
// ℹ️ This function is getting exported from the config folder. It runs most pieces of middleware
require('./config')(app)

// 👇 Start handling routes here
// Contrary to the views version, all routes are controlled from the routes/index.js
const allRoutes = require('./routes')
app.use('/api', allRoutes)

app.use((req, res) => res.sendFile(__dirname + '/public/index.html'))
// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes

module.exports = app
