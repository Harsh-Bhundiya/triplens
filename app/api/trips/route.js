import { connectDB } from "@/lib/mongodb";
import Trip from "@/models/trip";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { getSession } from "next-auth/react";
export async function POST(req){
    try{
        
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized! Please login first" }, { status: 401 });
        }

        const {tripname,destination,startingdate,endingdate}=await req.json();
        console.log("server recieved:",tripname,destination,startingdate,endingdate);
        await connectDB();
        let trip=await savedb(tripname,destination,startingdate,endingdate,session.user.id);
        return NextResponse.json({
            message: "Trip created successfully!",
            trip: trip
        }, { status: 201 });
    }
    catch(err){
        console.log("server error",err);
        return NextResponse.json({error:"internal server errror"},{status:500});
    }
}
async function savedb(tripname,destination,startingdate,endingdate,sessionid){
    //creating source code for the trip
    try{
        const randomstring=Math.random().toString(36).substring(2,6);
        const cleancity=destination.toLowerCase().replace(/\s+/g,"");
        const sharecode=`${cleancity}-${randomstring}`;
        let trip1=new Trip({
            title:tripname,
            destination:destination,
            startdate:startingdate ? new Date(startingdate) : null,
            enddate:endingdate? new Date(endingdate):null,
            sharecode:sharecode,
            createdby:sessionid,
            members:[sessionid],
            hotels:[],
            places:[],
            expenses:[],
        })
        await trip1.save();
        return trip1;
    }
    catch(err){
        console.log("err generated during the saving into database",err);
        return null;
    }
}
export async function GET(){
    try{
        const session=await getServerSession(authOptions);
        if(!session || !session.user){
            return NextResponse.json({error:"unauthorized excess"},{status:401});
        }

        await connectDB();
        const mytrips=await Trip.find({members:session.user.id}).sort({createdat:-1})

        return NextResponse.json({trips:mytrips},{status:200});
    }
    catch(err){
        console.log("while fetching the trips",err);
        return NextResponse.json({error:"internal server error"},{status:500})
    }
}