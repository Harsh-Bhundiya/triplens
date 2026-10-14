"use client"
import { GoogleGenAI } from '@google/genai'
import React, { useState } from 'react'
import AuthButton from '@/components/AuthButton'
const page = () => {
   const [formdata,setformdata]=useState({
        question:"",
        city:""
   })
   const handlechange=(event)=>{
        setformdata((currdata)=>{
            return {...currdata, 
                [event.target.name]:event.target.value}
        })
   }
   let resolvedquery=async(e)=>{
        e.preventDefault();
        let res=await fetch(`api/chat?query=${encodeURIComponent(formdata.question)}&city=${encodeURIComponent(formdata.city)}`);//if you are used here just question then hall text area is sended at backend but we doesnt want to sent it we just sent want to quesiton 
        let data=await res.json();
        console.log("gemini replay",data);
        return data;
   }    
  return (
    <div>
      <AuthButton/>
      <form action="">
        <input type="text"  placeholder='enter city name which you want to convey with ai ' id='city' name='city' value={formdata.city} onChange={handlechange}/>
        <textarea name="question" id="question" placeholder='how we can help you' value={formdata.question} onChange={handlechange}></textarea>
        <button onClick={resolvedquery}>send</button>
      </form>
    </div>
  )
}

export default page
