import mongoose, { Schema, Document, Model } from 'mongoose'
import validator from 'validator'

// Define the interface for the User document -> kiểu trả về cho các document trong MongoDB
export interface UserDoc extends Document {
  password?: string
  id?: string
  email: string
  image?: string
  name: string
  username: string
  isModified(path: string): boolean
}

const UserSchema: Schema = new Schema({
  password: { type: String, select: false },
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 50
  },

  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: (value: string) => validator.isEmail(value),
      message: 'Email không hợp lệ'
    }
  },

  image: { type: String },
  name: { type: String, required: true }
})

// Ensure returned JSON has `id` instead of `_id`, and remove internal fields.
UserSchema.set('toJSON', {
  virtuals: true,
  // Accept `any` here because mongoose returns a flexible object for `ret`.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: any, ret: any) => {
    // Convert ObjectId to string id, remove Mongo internals and sensitive fields
    if (ret._id) {
      ret.id = typeof ret._id === 'string' ? ret._id : ret._id.toString()
      delete ret._id
    }
    delete ret.__v
    // remove password if present (often excluded by `select: false`, but be safe)
    if (ret.password) delete ret.password
    return ret
  }
})

// Mirror toObject behavior as well (useful in some libraries)
UserSchema.set('toObject', { virtuals: true })

const UserModel: Model<UserDoc> = mongoose.model<UserDoc>('User', UserSchema)

export { UserModel }
