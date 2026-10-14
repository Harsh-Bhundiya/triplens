"use client"
import { Session } from "@google/genai";
import { useSession,signIn,signOut } from "next-auth/react"

export default function AuthButton(){
    const {data: session,status}=useSession();

    if(status==="loading"){
        return <p>Loading...</p>
    }
    if(session){
        return(
            <div>
                <p>logged in as:{session.user.name}</p>
                <button onClick={()=>signOut()}>sighout</button>
            </div>
        )
    }
    return <button onClick={()=>signIn("google")}>sign in with google</button>
}