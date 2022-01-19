const { Schema, model } = require('mongoose')
const ObjectId = Schema.Types.ObjectId

const sessionSchema = new Schema(
  {
    user: { type: ObjectId, ref: 'User' },
    createdAt: {
      type: Date,
      default: Date.now(),
      index: { expires: 1000 * 60 * 60 * 24 }, // 1 day
    },
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`
    timestamps: true,
  }
)

const Session = model('Session', sessionSchema)

module.exports = Session
