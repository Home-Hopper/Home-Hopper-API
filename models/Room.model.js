const { Schema, model } = require('mongoose')
const ObjectId = Schema.Types.ObjectId

const roomSchema = new Schema(
  {
    image: { type: String },
    title: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String },
    publishedBy: { type: ObjectId, ref: 'User', required: true },
    price: { type: Number, required: true },
    isDouble: { type: Boolean, required: true },
    bathrooms: { type: Number, required: true },
    totalRooms: { type: Number, required: true },
    area: { type: Number, required: true },
    isAdActive: { type: Boolean },
    isRented: { type: Boolean },
  },
  { timestamps: true }
)

const Room = model('Room', roomSchema)

module.exports = Room
