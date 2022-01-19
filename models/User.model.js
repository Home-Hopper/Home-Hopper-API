const { Schema, model } = require('mongoose')
const ObjectId = Schema.Types.ObjectId

const userSchema = new Schema(
  {
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    name: { type: String },
    lastName: { type: String },
    phone: { type: String },
    isLandlord: { type: Boolean, required: true },
    rooms: [{ type: ObjectId, ref: 'Room' }],
    savedRooms: [{ type: ObjectId, ref: 'Room' }],
  },
  { timestamps: true }
)

const User = model('User', userSchema)

module.exports = User
