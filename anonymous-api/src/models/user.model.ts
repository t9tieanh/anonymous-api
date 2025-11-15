import mongoose, { Schema, Document, Model } from 'mongoose'
import validator from 'validator'

// Define the interface for the User document -> kiểu trả về cho các document trong MongoDB
export interface UserDoc extends Document {
  username?: string
  password?: string
  email: string
  image?: string
  name: string
  isModified(path: string): boolean
}

const UserSchema: Schema = new Schema({
  username: { type: String, unique: true },
  password: { type: String, select: false },

  email: {
    type: String,
    required: true,
    validate: {
      validator: (value: string) => validator.isEmail(value),
      message: 'Email không hợp lệ'
    }
  },

  image: { type: String },
  name: { type: String, required: true }
})

const UserModel: Model<UserDoc> = mongoose.model<UserDoc>('User', UserSchema)

export { UserModel }
