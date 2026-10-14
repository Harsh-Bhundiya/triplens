import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import Trip from "@/models/trip";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(req,{params}){
    try{
        const session=await getServerSession(authOptions);
        if(!session || !session.user){
            return NextResponse.json({error:"unauthorized access"},{status:401});
        }
        const {id}=await params;

        const {hotel}=await req.json();
        if(!hotel){
            return NextResponse.json({error:"hotel data is required"},{status:400});
        }
        await connectDB();
        const trip=await Trip.findById(id);
        if(!trip){
            return NextResponse.json({error:"trip not found"},{status:404});
        }

        const hotelname=hotel.hotelname|| hotel.displayName?.text;

        const alredyexist=trip.hotels.some(
            (h)=>{return h.hotelname.toLowerCase()===hotelname.toLowerCase()}
        )
        
        if(alredyexist){
            return NextResponse.json({error:"this hotel is alredy added into trip"},{status:400});
        }

        await saveintodb(hotel,session.user.id,trip);

        return NextResponse.json({massage:"hotel added susccessfully"},{status:200});
    }
    catch(err){
        console.log(err);
        return NextResponse.json({error:'internal server error'},{status:500});
    }
}

async function saveintodb(hotel,user,trip){
    const newhotel={
        hotelname:hotel.hotelname|| hotel.displayName?.text,
        image:hotel.imageurl||"",
        price:hotel.price||"",
        rating:hotel.rating||0,
        address:hotel.address||hotel.formattedAddress||"",
        suggestby:user,
        votes:[
            {
                user:user,
                votetype:"Up",
            }
        ],
        isfinalized:false,

    }
    trip.hotels.push(newhotel);
    await trip.save();
    console.log(`hotel${hotel.hotelname} added to trip:${trip.title}`);
}

export async function PATCH(req,{params}){
    try{
        const session=await getServerSession(authOptions);
        if(!session||!session.user){
            return NextResponse.json({error:"unauthorized access"},{status:401});
        }
        const {id}=await params;
        const {hotelid,votetype}=await req.json();
        if(!hotelid||!votetype){
            return NextResponse.json({error:'hotelid and vote type is not given'},{status:400})
        }
        await connectDB();

        await updatedb(id,hotelid,votetype,session.user.id);

        return NextResponse.json({error:"data will updated"},{status:200});
    }
    catch(err){
        console.log("patch request error",err);
        return NextResponse.json({error:"internal server error"},{status:500});
    }
}
async function updatedb(tripid,hotelid,votetype,userid){
    const trip=await Trip.findById(tripid);
    if(!trip){
        return NextResponse.json({error:"trip not found"},{status:404})
    }
    const hotel=trip.hotels.id(hotelid);
    if(!hotel){
        return NextResponse.json({error:"hotel not found in this trip"},{status:404});
    }

    //check the whether the give user alredy do voting
    let voteindx=-1;
    for(let i=0;i<hotel.votes.length;i++){
        if(hotel.votes[i].user.toString()===userid){
            voteindx=i;
            break;
        }
    }

    if(voteindx===-1){
        //we need to add new vote
        let newvote={
            user:userid,
            votetype:votetype,
        }

        hotel.votes.push(newvote);
        await trip.save();
        
    }
    else{
        //we need to change the votetype
        let existingvotetype=hotel.votes[voteindx].votetype;
        if(existingvotetype===votetype){
            //then remove the vote
            hotel.votes.splice(voteindx,1);
            await trip.save();
        }
        else{
            //change the vote
            hotel.votes[voteindx].votetype=votetype;
            await trip.save();
        }

    }
     
}