const express = require("express");
const morgan = require("morgan");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require('cors');
const cookieParser = require("cookie-parser")
const initSocketIO = require("./Socket/socket");
const swaggerUI = require("swagger-ui-express");
const {Server}= require("socket.io");

const swaggerSpec = require("./swagger");


dotenv.config({ path: 'config.env' });

const mountRoutes = require("./routes/index");


const app = express();
app.use(cors({
    origin: process.env.ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH','PUT', 'DELETE']
}));
app.use(express.json());
app.use(cookieParser());

mountRoutes(app);

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerSpec));


mongoose.connect('mongodb://localhost:27017/Full-Ecommerce')
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

app.get('/', (req, res) => {
    res.send('out api ');
});
const server = require('http').createServer(app);
const io = new Server(server, {
    pingTimeout: 60000,
    cors: {
        origin: "*" ,
        methods: ["GET", "POST", "PUT", "DELETE"]
    },
});

initSocketIO(io);
const port = process.env.PORT;

server.listen(port, () => {
    console.log(`app is running in  port :${port}`);
});