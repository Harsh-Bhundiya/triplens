"use client"
import React, { useState } from 'react'
import { useSearchParams } from 'next/navigation'
const page = () => {

    const searchParams=useSearchParams();
    const hotelparam=searchParams.get("hotel")
    let city=null;//used for viewindetails
    let address=null;//used for ebstrating city
    let hotel=null
    const [photos,setphotos]=useState([]);
    if(hotelparam){
        try{
            hotel=JSON.parse(decodeURIComponent(hotelparam));
            address=hotel.address;
        }
        catch(e){
            console.error("failed to parse hotel data",e)
        }
    }
    if (!hotel) {
        return <div style={{ padding: "20px" }}>No hotel selected.</div>;
    }
    let morephots=async ()=>{
        city=extractcity(address);
        let res = await fetch(`/api/viewindetail?query=${encodeURIComponent(hotel.hotelname)}&city=${city}`);
        let data=await res.json();
        console.log(data,"is a backend data");

        console.log("laoding imgs");
        setphotos(data.images)

    }
    function extractcity(address){
        if(!address){
           return "";
        }
        const parts=address.split(",");
        return parts[parts.length-3]?.trim()||"";
    }
    console.log("hotel data got from the url are",hotel)
  return (
    <div>
        <div id='hoteldiv'>
            <h1>{hotel.hotelname}</h1>
            <img src={hotel.imageurl} alt="" height={400} width={400}/>
            <div className='about'>
                <p>rating is:{hotel.rating}{hotel.ratingcount>0?<span>out of ({hotel.ratingcount})</span>:<span>out of (1)</span>}</p>
                <p>address is:{hotel.address}</p>
                <p>contact details:{hotel.internationalPhoneNumber}</p>
                <p>official website:
                    <a href={hotel.websiteUri}>click here for visit </a> 
                </p>
                <p>location on google map:
                    <a href={hotel.googleMapsUri}>open in map</a>
                </p>
                <p>about hotel:{hotel.description?.join(" , ")}</p>
                
            </div>
            <button onClick={morephots}>view more phots</button>
        
            <div id='morephotos'>
                {
                    photos.map((photo,index)=>{
                        return (
                        <img
                            key={index}
                            src={photo}
                            width={500}
                            height={500}
                        />)
                    })
                }

                {/* its take more time of my because the in the frontend console whatever urls are printing that are not working at broser side however backend urls working at browser imgs succesfully loaded then i without worry about the console and urls just using state of react try to load imgs and imgs are loaded susccessfully */}
            </div>
        </div>
        
    
    </div>
  )
}
export default page