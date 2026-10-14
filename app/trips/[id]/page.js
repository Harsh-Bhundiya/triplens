"use client"
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';   //{map}
const TripMap = dynamic(() => import('@/components/TripMap'), { ssr: false });
import ExpenseTracer from '@/components/ExpenseTracer';
const page = () => {
  const [loading,setloading]=useState(true);
  const [trip,settrip]=useState(null);
  const [copy,setcopied]=useState(false);
  const [editingplace,seteditingplace]=useState(null);
  const [selectday,setselectday]=useState(1);
  const [activetab,setactivetab]=useState("hotels");
  const [expenseform,setexpenseform]=useState({
    title:"",
    amount:"",
    category:"Other",
    paidby:"",
    splitamong:[],
  })

    const paramas=useParams();

    const tripid=paramas.id;
    useEffect(()=>{
        if(tripid){
            gettrip();
        }
        
    },[tripid]);

    async function gettrip(){
        setloading(true);
        let res=await fetch(`/api/trips/${tripid}`);
        let data=await res.json();
        console.log(data);

        settrip(data.trip);
        setloading(false);
    }
    if(loading){
      return <div>lading trip details...</div>
    }
    if(!trip && !loading){
      return <div>trip not found</div>
    }
    let copysharecode=()=>{
      if(trip.sharecode){
        navigator.clipboard.writeText(trip.sharecode);
        setcopied(true);
        setTimeout(() => {
          setcopied(false);
        }, 2000);
      }
    }
    let handlevote=async(hotelid,votetype)=>{
      let res=await fetch(`/api/trips/${tripid}/hotel`,{
        method:"PATCH",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          hotelid:hotelid,
          votetype:votetype,
        })
      });
      if(res.status===200){
        gettrip();
      }
    }
    const calculatetotaldays=()=>{
      if(trip?.startdate && trip?.enddate){
        const start=new Date(trip.startdate);
        const end=new Date(trip.enddate);
        const difftime=end-start;
       
        const diffdays=Math.ceil(difftime/(1000*60*60*24))+1;
        if(diffdays===0 || diffdays<0){
          return -1;
        }
        return Math.max(diffdays,1);
      }
      return 5;
    }
    const handleschedule=async()=>{
      if(!editingplace) return;

      let num=calculatetotaldays();
      if(num>0 && selectday>num){
        alert("choose appropriate number of the day ");
        return;
      }
      try{
        let res=await fetch(`/api/trips/${tripid}/place`,{
          method:"PATCH",
          headers:{
            "Content-Type":"application/json",
          },
          body:JSON.stringify({
            placeid:editingplace._id,
            day:Number(selectday),
          })
        });
        if(res.status===200){
          seteditingplace(null);
          setselectday(1);
          
          gettrip();

        }
        else{
          alert("failed to update schedule");
        }
      }
      catch(err){
        console.log("error in updating schedule",err);
      }
    }
  return (
    <div>
      <div id='backbuttondiv'>
        <button onClick={()=>{window.location.href="/trips"}} id='backbutton'>back to my trip</button>
      </div>
      <div id='tripheader'>
        <h1>{trip.title}</h1>
        <p>destination:{trip.destination}</p>
        <p>🗓️ Dates:{trip.startdate?new Date(trip.startdate).toLocaleDateString():"flexible"}-{trip.enddate?new Date(trip.enddate).toLocaleDateString():"flexible"}</p>
        <div>
          <span>
            invite code: <strong>{trip.sharecode}</strong>
          </span>
          <button onClick={copysharecode}>{copy?"✅ Copied!" : "📋 Copy Code"}</button>
        </div>
        <div>
          <button onClick={()=>{setactivetab("hotels")}}>   🏨 Hotels ({trip.hotels?.length || 0})</button>
          <button onClick={()=>{setactivetab("places")}}> 🏖️ Places ({trip.plcaes?.length || trip.places?.length || 0})</button>
          <button onClick={()=>{setactivetab("expenxes")}}>expenses</button>
        </div>
        <div>
          {activetab==="hotels" &&(
            <div>
              <div className='hotelscard'>
                <h3>shortlisted hotels</h3>
                <button onClick={()=>{window.location.href=`/hotellistf?tripid=${trip._id}&city=${trip.destination}`}}> search & add hotel</button>
              </div>
              {
                (!trip.hotels|| trip.hotels.length===0)?<p>no hotels added yet .click"add hotel" to add options for voting </p>:
                <div>
                  {/* hotel list rendring here */}
                  {trip.hotels.map((hotel,ind)=>{
                    const upvotes=hotel.votes?.filter(v=>v.votetype==="Up").length||0;
                    const downvotes=hotel.votes?.filter(v=>v.votetype==="Down").length||0

                    return(
                      <div key={ind}>
                        <img src={hotel.image} alt={hotel.name} />
                        <div>
                          <h4>{hotel.hotelname}</h4>
                          <p>{hotel.address}</p>
                          <p>{hotel.rating}</p>

                        </div>
                        <div>
                          <button onClick={()=>handlevote(hotel._id,"Up")}>👍{upvotes}</button>
                          <button onClick={()=>handlevote(hotel._id,"Down")}>👎{downvotes}</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              }
            </div>
          )}
        </div>
        {activetab==="places" &&(
         
          <div className='placescard'>
             <TripMap places={trip?.places || trip?.places || []} />
            <h3>places to visit</h3>
            <button onClick={()=>{window.location.href=`/searchresult?tripid=${trip._id}&city=${trip.destination}`}}>+addplaces</button>
            {
              (!trip.places|| trip.places.length===0?<p>not any places added yet</p>:
              <div>
                {/* visits places display here */}
                {
                  trip.places.map((place)=>{
                    return(
                      <div key={place._id}>
                        {/* image */}
                        {place.image?(<img src={place.image}></img>):<div>no photo</div>}


                        {/* placeinfo */}
                        <div>
                          <h4>{place.placename}</h4>
                          <p>
                            🗓️ Schedule: <strong>Day {place.day || 1} <button onClick={()=>{seteditingplace(place);setselectday(place.day||1)}}>change schedule</button></strong>
                          </p>
                          {place.location?.latitude?(<p>📍 Latitude: {place.location.latitude.toFixed(4)}, Longitude: {place.location.longitude.toFixed(4)}</p>):null}
                        </div>
                      </div>

                    )
                  })
                }
              </div>)
            }
          </div>
        )}

        {activetab === "expenxes" && (
          <ExpenseTracer 
            tripid={tripid} 
            members={trip.members}      
            createdby={trip.createdby} 
            expenses={trip.expenses || []} 
            onexpenseadd={gettrip}
          />
        )}
          
      
      </div>
      
      {
        editingplace&&(
          <div>
            <div>
              <h3>changeschedule</h3>
              <p>select day for {editingplace.placename}</p>
            </div>
            <div>
              <input type="Number" placeholder='enter the day number ' value={selectday} onChange={(e)=>setselectday(e.target.value)}/>
            </div>
            <div>
              <button onClick={()=>{seteditingplace(null)}}>cancel</button>
              <button onClick={handleschedule}>save changes</button>
            </div>
          </div>
        )
      }
    </div>
    
  )
}

export default page
