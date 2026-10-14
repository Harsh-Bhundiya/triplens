"use client"
import React, { useEffect, useState } from 'react'



const page = () => {
    const [fromdata,setfromdata]=useState({
        tripname:"",
        destination:"",
        startingdate:"",
        endingdate:"",
    });
    const [trips,settrips]=useState([]);
    const [join,setjoin]=useState({
        tripcode:"",
    })
        const fetchmytrips=async()=>{
            try{
                const res=await fetch("api/trips");
                const data=await res.json();
                if(data.trips){
                    settrips(data.trips);
                }
            }
            catch(err){
                console.log(err);
            }
        }
        useEffect(()=>{
            fetchmytrips();
        },[]);
    let datachange=(e)=>{
        return(
            setfromdata((currentdata)=>{
                return {...currentdata,[e.target.name]:e.target.value}
            })
        )
    }
    const creattrip=async(e)=>{
        e.preventDefault();
        try{
            const res=await fetch('/api/trips',{
                method:"POST",
                headers:{
                    "content-Type":"application/json",
                },
                body:JSON.stringify(fromdata),
            })
            const data=await res.json();
            console.log("server response",data);
            if(res.ok){
               

                //reseting formdata
                setfromdata({
                    tripname:"",
                    destination:"",
                    startingdate:"",
                    endingdate:"",
                })

                fetchmytrips();

            }
            else{
                alert("failed to  creat trip");
            }
        }catch(err)
        {
            console.log("error creating trip",err);
        }

    }
    const handlejoin=async (e)=>{
        e.preventDefault();

        const res=await fetch("/api/trips/join",{
            method:"POST",
            headers:{
                "content-type":"application/json"
            }, 
            body:JSON.stringify({
                tripcode:join.tripcode
            })

        })
        const data=await res.json();
        if(res.status===200){
            alert("trip joined successfully");
            window.location.href=`trips/${data.tripid}`
        }
        else{
            alert("failed to join trip",data.error);
        }
    }
  return (
    <div>
    
      <form action="">
        <input type="text" placeholder='enter the trip name here' name='tripname' value={fromdata.tripname} onChange={datachange}/>
        <input type="text" placeholder='enter the destination' name='destination' value={fromdata.destination} onChange={datachange}/>
        <input type="date" placeholder='starting date of the trip'name="startingdate" value={fromdata.startingdate} onChange={datachange}/>
        <input type="date" placeholder='ending date of the trip' name='endingdate' value={fromdata.endingdate} onChange={datachange}/>
        <button onClick={creattrip}>creat trip</button>
      </form>

      <form action="">
        <input type="text" placeholder='enter trip code here'name='tripcode' value={join.tripcode} onChange={(e)=>{setjoin({...join,[e.target.name]:e.target.value})}}/>
        <button type='submit' onClick={handlejoin}>join a trip</button>
      </form>

        <div style={{ marginTop: "30px" }}>
            <h3>My Trips</h3>
            {trips.map((t) => (
                <div key={t._id} style={{ border: "1px solid #ccc", padding: "15px", margin: "10px 0" }}>
                    <h4>{t.title} ({t.destination})</h4>
                    <p>Share Code: <strong>{t.sharecode}</strong></p>
                    <button onClick={() => window.location.href = `/trips/${t._id}`}>Open Trip</button>
                </div>
            ))}
        </div>
    </div>
  )
}

export default page
