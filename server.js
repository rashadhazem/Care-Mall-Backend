const express = require("express");
const morgan = require("morgan");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require('cors');
const cookieParser = require("cookie-parser")

const swaggerUI = require("swagger-ui-express");


const swaggerSpec = require("./swagger");


dotenv.config({ path: 'config.env' });

const mountRoutes = require("./routes/index");


const app = express();
app.use(cors({
    origin: process.env.ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
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

const port = process.env.PORT;

const server = app.listen(port, () => {
    console.log(`app is running in  port :${port}`);
});

const io = require('socket.io')(server, {
    pingTimeout: 60000,
    cors: {
        origin: process.env.ORIGIN || "http://localhost:3000",
    },
});

io.on("connection", (socket) => {
    console.log("Connected to socket.io");

    socket.on("setup", (userData) => {
        socket.join(userData._id);
        socket.emit("connected");
    });

    socket.on("join chat", (room) => {
        socket.join(room);
        console.log("User Joined Room: " + room);
    });

    socket.on("new message", (newMessageRecieved) => {
        var chat = newMessageRecieved.chat;

        if (!chat.participants) return console.log("chat.participants not defined");

        chat.participants.forEach((user) => {
            if (user._id == newMessageRecieved.sender._id) return;

            socket.in(user._id).emit("message recieved", newMessageRecieved);
        });
    });

    socket.off("setup", () => {
        console.log("USER DISCONNECTED");
        socket.leave(userData._id);
    });
});

// Handle unhandled rejections outside express
process.on('unhandledRejection', (err) => {
    console.error(`UnhandledRejection Errors: ${err.name} | ${err.message}`);
    server.close(() => {
        console.error(`Shutting down....`);
        process.exit(1);
    });
});
