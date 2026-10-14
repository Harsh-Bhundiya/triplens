import { connectDB } from "@/lib/mongodb";
import Trip from "@/models/trip";
import { NextResponse } from "next/server";

export async function GET(req,{params}){
    try{
        const {id}=await params;
        await connectDB();
        const trip=await Trip.findById(id).populate("members","name email").populate("createdby","name email");
        if(!trip){
            return NextResponse.json({error:"trip not found"},{status:400})
        }
        return NextResponse.json({trip:trip},{status:200})
    }
    catch(err){
        return NextResponse.json({error:"internal server error"},{status:500});
    }
}