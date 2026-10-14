"use client"
import React, { useEffect, useState } from 'react'
import "./style.css"
import { useSearchParams } from 'next/navigation'
const Searchresult = () => {

  const [formdata,setformdata]=useState({
    city:"",
    state:"",
    country:""
  })
  const[places,setplaces]=useState([])//store search result
  const[loading,setloading]=useState(false);//laoder 
  const[error,seterror]=useState("") //handling error

  const searchparams=useSearchParams();
  const tripid=searchparams.get("tripid");
  const city=searchparams.get("city");

  useEffect(()=>{
    if(tripid && city){
      searchplaces(city,"",""); 
    }
  },[city]);

  let handlechange=(env)=>{
    setformdata((currdata)=>{
      return{...currdata,[env.target.name]:env.target.value};
    })
  }

  const handlesubmit=async (e)=>{
    e.preventDefault();
   

    searchplaces(formdata.city,formdata.state,formdata.country);
  }
  async function searchplaces(city1,state,country){
    setloading(true);
    seterror("");
    setplaces([]);
    const res=await fetch(`api/search?city=${encodeURIComponent(city1)}&state=${encodeURIComponent(state)}&country=${encodeURIComponent(country)}`);
    const result=await res.json();
    console.log(result);
    if(res.ok){
      setplaces(result.places||[])
    }
    else{
      seterror(result.error||"no data found");
    }
    setloading(false);
  }
  let handleaddplaces=async (place)=>{
    let res=await fetch(`/api/trips/${tripid}/place/`,{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
      },
      body:JSON.stringify({
        place:place,
      })

    })
    if(res.status===200){
      console.log("place is added into trip");
      alert("place is added");
      window.location.href=`/trips/${tripid}`
    }
    else{
      let data=await res.json();
      console.log(data.error);
      alert("failed to add trip");
    }
  }
  return (
    <div>
      serch for any city
      <form onSubmit={handlesubmit}>
        <input type="text" placeholder="enter city name" name="city" value={formdata.city} onChange={handlechange}/>
        <input type="text" placeholder="enter state name" name="state" value={formdata.state} onChange={handlechange}/>
        <input type="text" placeholder="enter country name" name="country" value={formdata.country} onChange={handlechange} />
      
        <button>submit</button>
      </form>

      <h1>all places</h1>
      {loading && <p>searchin in the web...</p>}
      {error && <p>{error}</p>}
      <div className='searchresult'>
        {
          places.map((place,ind)=>{
            return(
              <div key={ind} className='card'>
                {place.image && (
                  <img src={place.image} alt={place.name} className='placeimg' />
                )}
                <h4>{place.name}</h4>
                <p>Rating: {place.rating}</p>
                <p>Kinds: {place.kinds}</p> 
                {tripid && (
                  <button onClick={()=>handleaddplaces(place)}>add to trip</button>
                )}
              </div>
            )
          })
        }
      </div>
    </div>
  )
}

export default Searchresult
