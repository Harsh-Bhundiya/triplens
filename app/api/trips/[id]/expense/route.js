import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import Trip from "@/models/trip";
export async function POST(req,{params}){
    try{
        await connectDB();
        let session=await getServerSession(authOptions);
        if(!session || !session.user){
            return NextResponse.json({error:"unauthorized access"},{status:401});
        }
        let body=await req.json();

        let expensedata=body.expensedata;
        let {id}=await params;

        if(!expensedata || !id){
            return NextResponse.json({error:"bad request "},{status:400});
        }

        let massage=await saveintodb(session,id,expensedata);
        if(massage.status===200)
        return NextResponse.json({massage:"expense details added"},{status:200});
        else{
            return NextResponse.json({error:"internal server error"},{status:500});
        }
    }
    catch(err){
        console.log(err,"server error");
        return NextResponse.json({error:"internal server error"},{status:500});
    }
}

async function saveintodb(session,id,expensedata){
    try{
        let userid=session.user;
        
        //find trip and add expenses
        let trip=await Trip.findById(id);

        if(!trip){
            return NextResponse.json({error:"trip is not found"},{status:400});
        }
        //creating new expense
        let title=expensedata.title||"";
        let amount=Number(expensedata.amount)||"";
        let category=expensedata.category||"";
        let paidby=expensedata.paidby||session.user.id||session.user._id;
        
        let doessplit=expensedata.doessplit;
        if(doessplit){
            let splittedamount=amount/trip.members.length;
            let splitamong=trip.members;

            let date=new Date();

            let expenseobj={title,amount,category,paidby,splitamong,date};

            trip.expenses.push(expenseobj);

            await trip.save()

          return NextResponse.json({massage:"data saved"},{status:200})
            

        }
        else{
            let splitamong=expensedata.splitamong;
            let date=new Date();
            let expenseobj={title,amount,category,paidby,splitamong,date};

            trip.expenses.push(expenseobj);

            await trip.save();

            return NextResponse.json({massage:"data saved"},{status:200});
           
        }

    }
    catch(err){
        console.log(err,"cant save into db");
        return NextResponse.json({error:"internal server error"},{status:500});
    }
}