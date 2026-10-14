import { connectDB } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import Trip from "@/models/trip";

export async function POST(req) {
    try {
        await connectDB();

        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });
        }

        let body = await req.json();
        let tripcode = body.tripcode;

        if (!tripcode) {
            return NextResponse.json({ error: "tripcode is required" }, { status: 400 });
        }

        // DB save function call
        let result = await saveintodb(tripcode, session.user.id);

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: result.status || 400 });
        }

        // ✅ tripId wapas bhej rahe hain taaki redirect ho sake
        return NextResponse.json({ 
            message: "Successfully added to trip", 
            tripId: result.tripId 
        }, { status: 200 });

    } catch (err) {
        console.log("server error", err);
        return NextResponse.json({ error: "internal server error" }, { status: 500 });
    }
}

async function saveintodb(tripcode, userid) {
    try {
        let trip = await Trip.findOne({ sharecode: tripcode.trim().toLowerCase() });
        if (!trip) {
            return { error: "Trip not found", status: 404 };
        }

        // ✅ 'userid' use kiya (no crash)
        const isalredymember = trip.members.some(m => m.toString() === userid.toString());

        if (!isalredymember) {
            trip.members.push(userid);
            await trip.save();
        }

        // ✅ Seedha tripId return karo
        return { success: true, tripId: trip._id };

    } catch (err) {
        console.log("database error", err);
        return { error: "database error", status: 500 };
    }
}