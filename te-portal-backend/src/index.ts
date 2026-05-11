import express, { type Application } from "express";
import allRoutes from "./routes";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import registerChannelSocket from "./socket/channel.socket";
import registerDirectConversationSocket from "./socket/directConversation.socket";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const app: Application = express();
const port: number = parseInt(process.env.PORT || '4000');
const host: string = process.env.HOST || '0.0.0.0';

app.use(express.json());
// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// CORS Configuration - Support both localhost and LAN
const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : [
      'http://localhost:5173', 
      'http://localhost:5174',
      'http://192.168.4.128:5173',
      'http://192.168.4.128:5174'
    ];

console.log("🌐 CORS Origins configured:", corsOrigins);

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: corsOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
});

// Make io accessible to routes
app.set('io', io);

// Track online users
const onlineUsers = new Map(); // userId -> socketId

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("Unauthorized. No token provided."));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    // Fetch user details from database
    const User = (await import("../models/User")).default;
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return next(new Error("User not found"));
    }

    (socket as any).user = {
      id: (user as any).id,
      email: (user as any).email,
      name: (user as any).name,
      image: (user as any).image,
    };

    next();
  } catch (error) {
    return next(new Error("Forbidden - Invalid or expired token"));
  }
});

async function handleClientConnection(socket: any) {
  const userId = socket.user.id;
  const userName = socket.user.name;
  console.log("✅ Client connected:", {
    socketId: socket.id,
    userId,
    userName,
    timestamp: new Date().toISOString()
  });

  // Add user to online users
  onlineUsers.set(userId, socket.id);
  
  // Join user to their personal room for direct notifications
  socket.join(`user:${userId}`);
  console.log(`✅ User joined personal room: user:${userId}`);
  
  // Broadcast user online status
  socket.broadcast.emit('user_online', { userId });
  
  // Send current online users to the new client
  socket.emit('online_users', { users: Array.from(onlineUsers.keys()) });

  // Auto-join all user's direct conversation rooms
  try {
    const DirectConversation = (await import("../models/directConversation")).default;
    const { Op } = await import("sequelize");
    
    const conversations = await DirectConversation.findAll({
      where: {
        [Op.or]: [
          { userOneId: userId },
          { userTwoId: userId }
        ]
      }
    });

    console.log(`🔄 Auto-joining ${conversations.length} conversation rooms for user ${userId}`);
    
    for (const conversation of conversations) {
      const roomName = `conversation:${(conversation as any).id}`;
      socket.join(roomName);
      console.log(`✅ Auto-joined conversation room: ${roomName}`);
    }
  } catch (error) {
    console.error('❌ Error auto-joining conversation rooms:', error);
  }

  // Auto-join all user's channel rooms
  try {
    const ChannelMember = (await import("../models/channelMember")).default;
    const Channel = (await import("../models/Channel")).default;
    
    const channelMemberships = await ChannelMember.findAll({
      where: { userId },
      include: [{ model: Channel }]
    });

    console.log(`🔄 Auto-joining ${channelMemberships.length} channel rooms for user ${userId}`);
    
    for (const membership of channelMemberships) {
      const channel = (membership as any).Channel;
      if (channel) {
        const roomName = `channel:${channel.id}`;
        socket.join(roomName);
        console.log(`✅ Auto-joined channel room: ${roomName}`);
      }
    }
  } catch (error) {
    console.error('❌ Error auto-joining channel rooms:', error);
  }

  registerChannelSocket(io, socket);
  registerDirectConversationSocket(io, socket);

  function handleClientDisconnection() {
    console.log("❌ Client disconnected:", {
      socketId: socket.id,
      userId,
      userName,
      timestamp: new Date().toISOString()
    });
    
    // Remove user from online users
    onlineUsers.delete(userId);
    
    // Broadcast user offline status
    socket.broadcast.emit('user_offline', { userId });
  }

  socket.on("disconnect", handleClientDisconnection);
}

io.on("connection", handleClientConnection);

app.use("/api", allRoutes);

server.listen(port, host, () => {
  console.log(`Server is listening on http://${host === '0.0.0.0' ? '192.168.4.128' : host}:${port}`);
  console.log(`Available on LAN: http://192.168.4.128:${port}`);
  console.log(`Available locally: http://localhost:${port}`);
});
