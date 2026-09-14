import mongoose from 'mongoose';
import dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const connectDB = async () => {
    try {
        console.log('MONGODB_URI existe:', Boolean(process.env.MONGODB_URI));
        console.log('MONGODB_URI empieza con:', process.env.MONGODB_URI?.slice(0, 20));

        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB conectado correctamente");
    } catch (error) {
        console.error("Error al conectar a MongoDB:", error.message);
        process.exit(1);
    }
};

export default connectDB;
