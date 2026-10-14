import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            authorization:{
                params:{
                    prompt:"select_account",
                }
            }
        })
    ],
    // 1. 'callbacks' with 's' at the end
    callbacks: {
        // SignIn callback: DB me user save karega
        async signIn({ user }) { 
            try {
                await connectDB();
                const existinguser = await User.findOne({ email: user.email });

                if (!existinguser) {
                    await User.create({
                        name: user.name,
                        email: user.email,
                        image: user.image,
                    });
                    console.log("New user registered in db:", user.email);
                } else {
                    if (existinguser.image !== user.image || existinguser.name !== user.name) {
                        existinguser.image = user.image;
                        existinguser.name = user.name;
                        await existinguser.save();
                    }
                }
                return true; // Login allow karein
            } catch (err) {
                console.log("User cant login database error", err);
                return false; // Error aaye toh deny karein
            }
        },

        // 2. 'session' callback 'callbacks' ke ANDAR hona chahiye:
        async session({ session }) {
            try {
                await connectDB();
                const dbuser = await User.findOne({ email: session.user.email });

                if (dbuser) {
                    session.user.id = dbuser._id.toString(); // MongoDB _id attach kiya
                }
            } catch (err) {
                console.log("Mongodb id cannot explicitly added into session", err);
            }
            return session; // <--- Yeh return hona sabse zaroori hai!
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        // signIn: '/login',
    }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };