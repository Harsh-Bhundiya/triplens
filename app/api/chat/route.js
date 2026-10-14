import { GoogleGenAI } from "@google/genai"; //refernce of the docs link  https://ai.google.dev/gemini-api/docs/tool-combination
import { NextResponse } from "next/server";
import City from "@/models/city";
import Hotel from "@/models/hotel";
import Place from "@/models/place";
import { connectDB } from "@/lib/mongodb";
// import place from "@/models/place";

const ai=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});
const tools = [
  {
    type: "function",
    name: "search_web_tavily",
    description: "Call this function to search live web data for hotels, places, or travel details when cached data is not enough.",
    parameters: {
      type: "OBJECT",
      properties: {
        searchQuery: {
          type: "STRING",
          description: "The search term for hotels or places"
        }
      },
      required: ["searchQuery"]
    }
  }
];
const TRIPLENS_SYSTEM_INSTRUCTION =`You are the AI assistant for a travel website called Triplens.
            Your job is only this:
            1. Respond to normal greetings (like "hi", "hello", "how are you").
            3. Use the provided cached travel data when relevant.
            4. Do not invent hotel or place information that is not present in the provided data.
            
            6. Politely decline non-travel-related questions.

            7. Answer travel-related questions — hotels, places, prices, availability, city recommendations, trip planning.
            8.data priority:first checked cached data if the any question of specific place or hotel is not found in cahced data then you can read requires data using external browser and internet .if using external browser or internet user query data not match then you can politely say soory .also when places and hotels data are founded in cached but user query is not satisfying with the answer in that case you also use tools external browser and internet 
            9.you doesnt need to explain the user this data is not founded in our caches and this data finding through the external browser or internet because its risky for my organization
            10.if you not found data through cached then you can use the search_web_tavily function.if live web search data couldnt resolve the query then say soory
            If the user asks something that is NOT related to travel/hotels/places (like coding help, movies, games, general knowledge, downloads, unrelated topics), politely decline and tell them you can only help with travel-related questions. Do not give an off-topic answer under any circumstances, even if the user insists.`


export async function GET(req){
    const {searchParams}=new URL(req.url);
    const question=searchParams.get("query");
    const cityname=searchParams.get("city");
    if(!question){
        return NextResponse.json({error:"query missing"},{status:400})
    }
    try{
        await connectDB();
        let contextdata="no cached data available for this city yet";
         const citydoc=await City.findOne({ name:cityname})
        if(citydoc){
            const places=await Place.find({cityid:citydoc._id}).select("name rating kinds");
            const hotel=await Hotel.find({cityid:citydoc._id}).select("name rating pricelevel address ratingcount website googlemapurl");
            contextdata=JSON.stringify({
                city:cityname,
                places:places,
                hotels:hotel
            })
        }
       if(contextdata==="no cached data available for this city yet"){
            contextdata=await gettavilycontext(question,cityname);
       }
        let intersection=await ai.interactions.create({
            model:"gemini-3.1-flash-lite",
            input:`here is the cached travel data ${contextdata} user question ${question}`,
            // tools:[{type:"google_search"}],
            tools:tools,
            system_instruction:TRIPLENS_SYSTEM_INSTRUCTION ,
            

        })
        //we need to check gemini calling the function or not 
        const functioncall=intersection.steps?.find(step=>step.type==="function_call");
        if(functioncall && functioncall.name==="search_web_tavily"){
            console.log("gemini calling the function tavily for find more data");

            const tavilydata=await gettavilycontext(question,cityname);

            intersection=await ai.interactions.create({
                model:"gemini-3.1-flash-lite",
                input:`live web search data:${tavilydata} for user question${question}`,
                system_instruction:`answer the user question using the live web search data .if the live web search data doesnt resolve the query of the user then say soory ${TRIPLENS_SYSTEM_INSTRUCTION}`
            })
        }
        return NextResponse.json({answer:intersection.output_text});
    }
    catch(e){
        return NextResponse.json({e});
    }
    
}
async function gettavilycontext(query,cityname){
    try{
        const res=await fetch("https://api.tavily.com/search",{
            method:"POST",
            headers:{
                "content-Type":"application/json"
            },
            body:JSON.stringify({
                api_key:process.env.TAVILY_API_KEY,
                query:query,
                search_depth:"basic",
                include_answer:true,
                max_results:3
            })
        });
        
        const data=await res.json();
        console.log("tavily data",data);
        return JSON.stringify(data);
    }
    catch(err){
        console.log("tavily search error",err);
        return "";
    }
}

