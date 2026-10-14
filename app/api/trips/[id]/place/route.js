import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import Trip from "@/models/trip";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export  async function POST(req,{params}){
    try{
        const session=await getServerSession(authOptions);
        if(!session){
            return NextResponse.json({error:"unauthorized access"},{status:401});
        }
        const {place}=await req.json()
        const {id}=await params;

        if(!place || !id){
            return NextResponse.json({error:"place details insufficient"},{status:400});
        }
        await connectDB();

       await addplaceintodb(id,session.user.id,place);

       return NextResponse.json({massage:"place is added successfully"},{status:200});
    }
    catch(err){
        return NextResponse.json({error:"internal server error"},{status:500});
    }
}

async function addplaceintodb(tripid,userid,place){
    try{
        const trip=await Trip.findById(tripid);
        const placearray=trip.places||[];
        const alredyexist=placearray.some((p)=>p.placename?.toLowerCase()===place.name?.toLowerCase());

        if(alredyexist){
            return NextResponse.json({error:"this place is alredy added into trip"},{status:400});
        }
        else{
            const newplace={
                placename:place.name,
                image:place.image,
                day:1,
                location:{
                    latitude:place.location?.latitude||0,
                    longitude:place.location?.longitude||0,
                },
                suggestedby:userid,
            }
            trip.places.push(newplace);

            await trip.save();
        }   

    }
    catch(err){
        console.log("couldnt finding trip or something database error",err);
        return NextResponse.json({error:err},{status:400});
    }
}

export async function PATCH(req,{params}){
    try{
        const session=await getServerSession(authOptions);
        if(!session){
            return NextResponse.json({error:"unauthorized access"},{status:401});
        }
        const {id}=await params;
        const {placeid,day}=await req.json();

        if(!id|| !placeid||!day){
            return NextResponse.json({error:"placed and day are required"},{status:400});
        }
        await connectDB();
        const trip=await Trip.findById(id);
        if(!trip){
            return NextResponse.json({error:"trip not found"},{status:400});
        }

        const placesarray=trip.places;
        const targetplace=placesarray.id(placeid);

        if(!targetplace){
            return NextResponse.json({error:"place not found"},{status:400});
        }
        targetplace.day=Number(day);
        await trip.save();
        console.log(`update place ${targetplace.placename} to day ${day}`);
        return NextResponse.json({messege:"schedule update sccessfully"},{status:200});

    }
    catch(err){
        console.log(err);
        return NextResponse.json({error:"internal server error"},{status:500});
    }
}