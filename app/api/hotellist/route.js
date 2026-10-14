const api_key = "5ae2e3f221c38a28845f05b6158fa2764e3c27f7e53233c236a4f928";
import { NextResponse } from "next/server";
const base_url = "https://api.opentripmap.com/0.1/en/places";
const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;
const google_key = process.env.GOOGLE_API_KEY;
import City from "@/models/city";
import Place from "@/models/place";
import mongoose from "mongoose";
import Hotel from "@/models/hotel";
import { connectDB } from "@/lib/mongodb";

export async function GET(req) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");
  const state = searchParams.get("state");
  const country = searchParams.get("country");

  console.log("City:", city, "State:", state, "Country:", country);

  //first check into database otherwise call the api
  let citydoc = await City.findOne({
    name: city,
    state: state,
    country: country,
  });
  console.log(citydoc, "is citydoc ");
  if (citydoc) {
    let cachedhotels = await Hotel.find({ cityid: citydoc._id });
    // console.log(cachedhotels);
    if (cachedhotels.length > 0) {
      console.log("returning cached hotels");
      //our frontend wants specific format like apis but backend data which are stored into database that cannot like api so
      let formatted = cachedhotels.map((h) => {
        return {
          id: h.googleplaceid,
          displayName: { text: h.name },
          formattedAddress: h.address,
          rating: h.rating,
          userRatingCount: h.ratingcount,
          imageurl: h.imageurl,
          types: h.types,
          googleMapsUri: h.googlemapurl,
          websiteUri: h.website,
          internationalPhoneNumber: h.phoneno,
          location: h.location,
        };
      });
      console.log("laoded through the databaes");
      // console.log(formatted,"sending from database");
      return Response.json(formatted);
    } 
  }
      const googleRes = await fetch(
        "https://places.googleapis.com/v1/places:searchText",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": google_key,
            "X-Goog-FieldMask":
              "places.id,places.displayName,places.formattedAddress,places.rating,places.location,places.userRatingCount,places.googleMapsUri,places.internationalPhoneNumber,places.websiteUri,places.priceLevel,places.regularOpeningHours,places.types",
          },
          body: JSON.stringify({
            textQuery: `hotels in ${city}`,
            includedType: "lodging",
          }),
        },
      );
      const googledata = await googleRes.json();
      // console.log(googledata)
      //just for finding names of hatel debugigng
      // googledata.places.map((g)=>{
      //   console.log(g.displayName.text)
      //   return g;
      // })
      let finalforusers = await findthephotos(googledata, city);

      await savedintodb(finalforusers, city, state, country);
      return Response.json(finalforusers);  
    }
    async function findthephotos(hotels, city) {
      let hotels_with_img = await Promise.all(
        hotels.places.map(async (hotel) => {
          const hotelname = hotel.displayName.text || "unknow hotel";

          const res = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(`${hotelname} ${city} exterior`)}&per_page=1&client_id=${UNSPLASH_KEY}`,
          );
          const data = await res.json();
          // console.log("phots details unplsh",data);

          let img = data.results?.[0]?.urls?.regular || null;
          return { ...hotel, imageurl: img };
        }),
      );
      //some photos are null
      let withoutphoto = hotels_with_img.filter((h) => {
        return h.imageurl === null;
      });

      if (withoutphoto.length > 0) {
        const fallback_res = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent("hotel exterior building")}&per_page=${withoutphoto.length}&client_id=${UNSPLASH_KEY}`,
        );
        const fallbackdata = await fallback_res.json();
        let fallbackphotos = fallbackdata.results || [];
        let counter = 0;
        withoutphoto.forEach((w) => {
          w.imageurl =
            fallbackphotos[counter % fallbackphotos.length]?.urls?.regular ||
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1080";
          counter++;
        });
      }
      console.log("final", hotels_with_img);
      return hotels_with_img;
    
}

async function savedintodb(hotels, c, s, co) {
  try {
    //first check whethere this city is present in city model if present then use that id not the new
    let citydoc = await City.findOne({
      name: c,
      state: s,
      country: co,
    }).select("_id");
    if (!citydoc) {
      console.log("city not found in database");
      //if city not found then first creat it then go ahed
      let city1 = new City();
      city1.name = c;
      city1.state = s;
      city1.country = co;
      city1.location.latitude = 0;
      city1.location.longnitude = 0;
      await city1.save();

      citydoc = city1;
      console.log("city created into db");
    }
    const cityid = citydoc._id;

    hotels.map(async (hotel) => {
      let hotel1 = new Hotel();
      hotel1.googleplaceid = hotel.id;
      hotel1.cityid = cityid;
      hotel1.name = hotel.displayName?.text || "unknown hotel";
      hotel1.rating = hotel.rating;
      hotel1.ratingcount = hotel.userRatingCount;
      hotel1.address = hotel.formattedAddress || "";
      hotel1.imageurl = hotel.imageurl || null;
      hotel1.phoneno = hotel.internationalPhoneNumber || null;
      hotel1.website = hotel.websiteUri || null;
      hotel1.googlemapurl = hotel.googleMapsUri || null;
      hotel1.pricelevel = hotel.priceLevel || null;
      hotel1.types = hotel.types || null;

      hotel1.location.latitude = hotel.location?.latitude || 0;
      hotel1.location.longitude = hotel.location?.longitude || 0;
      hotel1.metadata = hotel.regularOpeningHours || {};
      await hotel1.save();
      console.log("hotel is saved");
    });
  } catch (e) {
    console.log(e);
    return "something went wrong ";
  }
}
