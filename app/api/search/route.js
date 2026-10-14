const api_key="5ae2e3f221c38a28845f05b6158fa2764e3c27f7e53233c236a4f928"
import { NextResponse } from "next/server";
const base_url="https://api.opentripmap.com/0.1/en/places";
const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;
const google_key=process.env.GOOGLE_API_KEY;
import City from "@/models/city";
import Place from "@/models/place";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";




export async function GET(req) { 
//   console.log("UNSPLASH KEY:", UNSPLASH_KEY)
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");
  const state = searchParams.get("state");
  const country = searchParams.get("country");

  console.log("City:", city, "State:", state, "Country:", country);
  //connect to database
   await connectDB();
   console.log("database connected")
  //first searching into db
  let findcity=await searchintodb(city,state,country);
  console.log("found city id is ::::::::",findcity);
  const places1=await Place.find({cityid:findcity});
  if(!(findcity===null)){
    console.log("city found into database");
    // let result =await Place.find({cityid:findcity});
    
    if(places1.length>0){
      console.log("places found in to database ")
      return Response.json({places:places1}); 
    }
    console.log("places are not found search via api");
    
  }
  
  let geores=await fetch(`${base_url}/geoname?name=${city}&country=${country}&apikey=${api_key}`)
  let geodata=await geores.json()
  
  // console.log("this is result of geodata throght openmap ",geodata);

  if (!geodata.lat || !geodata.lon) {
    return Response.json({ error: "City not found" }, { status: 404 });
  }


  let latitude=geodata.lat;
  let longnitude=geodata.lon;

  let rediusurl=`${base_url}/radius?radius=5000&lon=${geodata.lon}&lat=${geodata.lat}&limit=15&apikey=${api_key}`
  // console.log(rediusurl);
  let radiusRes = await fetch(
    `${base_url}/radius?radius=20000&lon=${geodata.lon}&lat=${geodata.lat}&apikey=${api_key}`
  )
  let radiusdata=await radiusRes.json()

  // console.log("result of radiusurl of openmap",
  //   radiusdata);
  
  //finding top 10 best places inside that city
  let places=radiusdata.features ||[];
  // console.log("places are fffofajffadsfasfioaghsdoigdfhadvborgfb/;",places);
  let allratings=places.map((place)=>{return place.properties.rate});//just for see you how we can ebstract rating from the object
  places.sort((a,b)=>{return b.properties.rate-a.properties.rate})

  let top10plcaes=places.slice(0,10);
  let name=top10plcaes.map((oneplace)=>{return oneplace.properties.name})
  // console.log(name);

  const placesWithPhotos = await Promise.all(
  top10plcaes.map(async (place) => {
  const placeName = place.properties.name;

  //frist finding images by place name
  const searchQuery = `${placeName} ${city}`;  // "Sion Fort mumbai"

  const searchRes = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=1&client_id=${UNSPLASH_KEY}`
    );


    const searchData = await searchRes.json();
    // console.log(`Response for ${placeName}:`, searchData); 
    let imageUrl = searchData.results?.[0]?.urls?.regular || null;

    //if images not found then popular photos for that city will be added
    if(!imageUrl){
       console.log(`Unsplash image not found for "${placeName}". Trying City image for "${city}"...`)
    }

    return {
      name: placeName,
      rating: place.properties.rate,
      kinds: place.properties.kinds,
      image: imageUrl,
      latitude:place.geometry.coordinates[1],
      longitude:place.geometry.coordinates[0]
    };
  })
);
  console.log("places with phots",placesWithPhotos);
  // console.log("this is placewith pic using unsplaus",placesWithPhotos);
  // console.log("top 10plcaes",top10plcaes);

  // let finalresult =[]//we cant do that beacuse async function not wroks in map beaucese map is syncronize function  if we used then race condition will occur
  // let counter=0;
  // placesWithPhotos.map(async (placesWithPhoto)=>{
  //   if(placesWithPhoto.image===null){
  //     console.log(placesWithPhoto.name,"has no image found on unplsh")

  //     if(finalresult.length===0){
  //         const cityres=await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(`${city} tourism`)}&per_page=10&client_id=${UNSPLASH_KEY}`)
  //         const citydata=await cityres.json();
  //         finalresult=citydata.results
  //         if(finalresult.length>0){
  //             finalresult.sort((a, b) => b.likes - a.likes);
  //         }
  //         else {
  //             // Agar bilkul koi photo na mile, toh hamara safety placeholder
  //             finalresult="https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1080";
  //         }

  //         placesWithPhoto.image=finalresult[0];
  //         counter+=1;
  //     }
  //     else{
  //       placesWithPhoto.image=finalresult[counter];
  //       counter++;
  //     }
  //   }
  // })

  //lets do some simple task
  let placeswithoutphoto = placesWithPhotos.filter((p) => p.image === null);//filter actual pass by reference that means all the changes which you done on placeswithoutphot that will update in places with photo this is very ambressing mistake by me 

  let finalresult=[];
  if(placeswithoutphoto.length>0){
      const cityres=await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(`${city} tourism`)}&per_page=${placeswithoutphoto.length}&client_id=${UNSPLASH_KEY}`)
          const citydata=await cityres.json();
          finalresult=citydata.results;
          if(finalresult.length>0){
              finalresult.sort((a, b) => b.likes - a.likes);
          }
          else {
              // Agar bilkul koi photo na mile, toh hamara safety placeholder
               finalresult = [
                  {
                    urls: {
                      regular: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1080"
                    }
                  }
                ];
          } 
  }

  // console.log("final result are:",finalresult);

  let counter=0;
  placeswithoutphoto.map((p)=>{
    if(counter<finalresult.length){
      p.image=finalresult[counter].urls.regular;
      counter++;
    }
    else{
      p.image="https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1080";
    }
    
  })

  //  console.log("data sending from server",placeswithoutphoto);
  //  console.log("data sendin from server,",placesWithPhotos)

   await storecityintodatabase(city,state,country,geodata.lat,geodata.lon,{source:"opentrip",population:geodata.population,timezone:geodata.timezone});
   await Promise.all(placesWithPhotos.map(async(p)=>{
    await storeplacesintodatabase(city,state,country,p.name,p.rating||0,p.kinds.split(","),p.image,p.latitude,p.longitude);
   }))
   
  return Response.json({ places: placesWithPhotos /*,placeswithoutphoto    why this is commented its very ambressing mistake by me */});
  
  
}
async function storeplacesintodatabase(cityname,citystate,citycountry,placename,placerate,placeinfo,placeimage,placelat,placelon){
 
  try{
      let place1=new Place({});
      place1.cityid=await City.findOne({name:cityname,state:citystate,country:citycountry}).select("_id");
      if(!place1.cityid){
        place1.cityid=await City.findOne({name:cityname}).select("_id");
      }
      place1.name=placename;
      place1.rating=placerate;
      place1.kinds=placeinfo;
      place1.image=placeimage;
      place1.location.latitude=placelat;
      place1.location.longitude=placelon;
      await place1.save();
      console.log("place saved");
  }
  catch(err){
    console.log(err);
  }

}
async function storecityintodatabase(cityname,citystate,citycountry,citylat,citylon,citymata){
  //connect to the mongodb
  try{
     // pehle check karo city already hai kya is the correct code but not industrial standard 
    // let existingCity = await City.findOne({ name: cityname, state: citystate, country: citycountry });
    
    // if (existingCity) {
    //   console.log("city already exists, skipping duplicate save");
    //   return;   // ✅ duplicate save mat karo, seedha return kar do
    // }

    // let city1=new City({});
    // city1.name=cityname;
    // city1.state=citystate;
    // city1.country=citycountry;
    // city1.location.latitude=citylat;
    // city1.location.longitude=citylon;
    // city1.metadata=citymata;
    // city1.lastfatchedate=new Date();

    // // console.log("city1 info is like that you are sure to save ?",city1);
    // await city1.save();
    // console.log("data was saved");
     await City.findOneAndUpdate(
      { name: cityname, state: citystate, country: citycountry },  // dhundo isse
      {
        $setOnInsert: {   // sirf tab set karo jab NAYA document bane
          name: cityname,
          state: citystate,
          country: citycountry,
          location: { latitude: citylat, longitude: citylon },
          metadata: citymata,
          lastfatchedate: new Date(),
        }
      },
      { upsert: true, new: true }   // upsert: agar na mile toh create karo
    );
    console.log("city ensured in db (no duplicate)");
  }
  catch(err){
    console.log("mongodb err",err);
  }
}

async function searchintodb(cityname,statename,countryname){
  let idobj =await City.findOne({name:cityname,state:statename,country:countryname}).select("_id");
  if(!statename && !countryname){
    idobj=await City.findOne({name:cityname}).select("_id");
    
  }
  console.log(idobj);
   if (!idobj) {          // ✅ pehle hi check karo idobj khud null toh nahi
    return null;
  }
  let id=idobj._id;
  
  if(id===null){
    return null;
  }
  console.log("id of dwaeks",id);
  return id;
}
