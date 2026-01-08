const express = require("express");
const morgan = require("morgan");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require('cors');
const cookieParser = require("cookie-parser");

const initSocketIO = require("./Socket/socket");
const swaggerUI = require("swagger-ui-express");
const { Server } = require("socket.io");
const swaggerSpec = require("./swagger");

dotenv.config({ path: 'config.env' });

const helmet = require('helmet');

const rateLimit = require('express-rate-limit');
const globalError = require('./middlewares/errorMiddleware');
const ApiError = require('./utils/apiError');

const mountRoutes = require("./routes/index");


const app = express();

app.use(cors({
    origin: process.env.ORIGIN || 'http://localhost:5173', // Allow frontend
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
}));

// Security Middleware
app.use(helmet());
app.use(express.json({ limit: '10kb' })); // Limit body size
app.use(cookieParser());
// app.use(mongoSanitize());

// Rate Limiting
// const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 100, // Limit each IP to 100 requests per windowMs
//     message: 'Too many requests from this IP, please try again in an hour!'
// });
// app.use('/api', limiter);

mountRoutes(app);

app.get('/', (req, res) => {
    res.send('out api ');
});

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerSpec));

// Handle Unhandled Routes
app.all(/(.*)/, (req, res, next) => {
    next(new ApiError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handling Middleware
app.use(globalError);

mongoose.connect(process.env.DB_URI || 'mongodb://localhost:27017/Full-Ecommerce')
    .then((conn) => {
        console.log(`Database connected  :${conn.connection.host}`);
    })
    .catch(
        (error) => {
            console.error(`Database connection error :${error}`);
            process.exit(1);
        });

if (process.env.NODE_ENV == "development") {
    app.use(morgan('dev'));
    console.log(`mode is :${process.env.NODE_ENV}`);
}

const server = require('http').createServer(app);
const io = new Server(server, {
    pingTimeout: 60000,
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"]
    },
});

initSocketIO(io);
const port = process.env.PORT;

server.listen(port, () => {
    console.log(`app is running in  port :${port}`);
});