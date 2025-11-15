import express, { Router } from 'express'
import cloudinaryController from '~/controllers/cloudinary.controller'

const cloudinaryRoutes: Router = express.Router()

/**
 * Public proxy endpoint to stream files from Cloudinary to clients.
 * Example: GET /cloudinary-file?url=<cloudinary-raw-url>
 */
cloudinaryRoutes.get('/cloudinary-file', cloudinaryController.getCloudinaryFile)

export default cloudinaryRoutes
