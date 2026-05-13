import express from "express";
import dotenv from 'dotenv';
dotenv.config();
import http from "http";
import { Server } from "socket.io";
import cors from 'cors';
import productRoutes from './routes/productRoutes';
import paymentRoutes from './routes/paymentRoutes';
import authRoutes from './routes/authRoute';
import addressRoutes from "./routes/addressRoutes";
import orderRoutes from './routes/orderRoutes';
import cookieParser from 'cookie-parser';
import complaintRoutes from './routes/complainRoutes';
import discountRoute from './routes/discountRoutes';
import userRoutes from "./routes/userRoutes";
import offerRoutes from "./routes/offerRoutes";

const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use(cookieParser());

//  'https://tiny-maamoul-ab5c83.netlify.app'

const server = http.createServer(app);

app.use(cors({
    origin: ['http://localhost:5173', 'https://tiny-maamoul-ab5c83.netlify.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
const io = new Server(server, {
  cors: { origin: "*" }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("send_message", (data: { sender: string; message: string }) => {
    io.emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

app.get("/", (req, res) => {
  res.send("API Running 🚀");
});

// Routes use karein
app.use('/api/products', productRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/address', addressRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/discounts', discountRoute);
app.use('/api/users', userRoutes);
app.use('/api/deals', offerRoutes);

server.listen(5000, () => {
  console.log("Server running on port 5000");
});