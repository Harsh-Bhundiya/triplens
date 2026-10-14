"use client"



import React, { useEffect } from 'react'
import { useState } from 'react'
import "./style.css"
import { useSearchParams } from 'next/navigation'

    

const page = () => {
    const [formdata,setformdata]=useState({
        city:"",
        state:"",
        country:""
    })
    let [loading,setloading]=useState(false);
    

    let [hotels,sethotels]=useState([])
    // console.log("now hotels are",hotels);
    const searchparams=useSearchParams();
    const urlcity=searchparams.get("city");
    const tripid=searchparams.get("tripid");


    useEffect(()=>{
      if(urlcity){
          setformdata((currdata)=>{
            return{...currdata,city:urlcity}
          })
          fetchhotels(urlcity,"","")
      }
    },[urlcity]);


    async function fetchhotels(city,state,country){
       setloading(true)
        const res=await fetch(`api/hotellist?city=${city}&state=${state}&country=${country}`)
        let data=await res.json();
        console.log(data)
        
        let transformed=data.map((d)=>{
          return {//here extra field like imageurl etc are created redunduncy are there but it will just regering like hotelname referes to the d.displaname.text oll over its memory effiectient
            ...d,
            imageurl:d.imageurl,
            hotelname:d.displayName?.text,
            rating:d.rating,
            ratingcount:d.userRatingCount,
            description:d.types,
            address:d.formattedAddress
          }
        })
        sethotels(transformed)
        setloading(false)
    }


    let handlechange=(env)=>{
        setformdata((currdata)=>{
          return{...currdata,[env.target.name]:env.target.value};
        })
    }


    const handlesubmit=async (e)=>{
        e.preventDefault();
        fetchhotels(formdata.city,formdata.state,formdata.country);
    }
    const hoteldetail=(h)=>{
      const hoteldata=encodeURIComponent(JSON.stringify(h))
      window.location.href=`/viewindetail?hotel=${hoteldata}`
    }
    const handleaddtotrip=async (hotel)=>{
      try{
        let res=await fetch(`/api/trips/${tripid}/hotel`,{
          method:"POSt",
          headers:{
            "content-Type":"application/json"
          },
          body:JSON.stringify({
            hotel:hotel
          })
        });
        let data=await res.json();
        if(res.status===200){
          alert("hotel is added into trip");
          window.location.href=`trips/${tripid}`
        }
        else{
          alert("failed to add hotel");
        }
      }
      catch(err){
        console.log(err);
        alert("something went wrong")
      }  

    }
  return (
    <div>
        serch for any city hotel
      <form onSubmit={handlesubmit}>
        <input type="text" placeholder="enter city name" name="city" value={formdata.city} onChange={handlechange}/>
        <input type="text" placeholder="enter state name" name="state" value={formdata.state} onChange={handlechange}/>
        <input type="text" placeholder="enter country name" name="country" value={formdata.country} onChange={handlechange} />
        <button onClick={handlesubmit}>submit</button>
      </form>
      {loading && <p>searching in the web</p>}
      <div className='hotelsearch'>
        {
          hotels.map((h,ind)=>{
            return(
              <div key={ind} className='cardhotel'>
                <img className='imgofhotel' src={h.imageurl} alt={h.hotelName} />
                <h3>hotelname:{h.hotelname}</h3>
                <p>rating:{h.rating}({h.ratingcount})</p>
                <p>address:{h.address}</p>
                <button onClick={()=>hoteldetail(h)}>view in detail</button>
                {
                  tripid&&(
                    <button onClick={()=>{handleaddtotrip(h)}}>addtotrip</button>
                  )

                }
              </div>
            )
          })
        }
      </div>
    </div>
  )
}

export default page
