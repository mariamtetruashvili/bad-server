import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import mongoSanitize from 'express-mongo-sanitize'
import { errors } from 'celebrate'
import cors from 'cors'
import 'dotenv/config'
import express, { json, urlencoded } from 'express'
import mongoose from 'mongoose'
import path from 'path'
import cookieParser from 'cookie-parser'
import { DB_ADDRESS } from './config'
import errorHandler from './middlewares/error-handler'
import routes from './routes'

const { PORT = 3000 } = process.env
const app = express()


app.use(helmet({
    crossOriginResourcePolicy: false, 
}))

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
})

app.use(limiter)

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(cookieParser())
app.use(json({ limit: '10kb' }))
app.use(urlencoded({ extended: true }))

app.use(mongoSanitize())


app.use(express.static(path.join(__dirname, 'public')))
app.use('/images', express.static(path.join(__dirname, 'public/images')))

app.options('*', cors()) 
app.use(routes)

app.use(errors()) 
app.use(errorHandler) 

const bootstrap = async () => {
    try {
        await mongoose.connect(DB_ADDRESS)
        app.listen(PORT, () => console.log(`Server is running on port ${PORT}`))
    } catch (error) {
        console.error('Database connection error:', error)
    }
}

bootstrap()