"use client";
import Image from "next/image";
import styles from "./page.module.css";
import AuthButton from "@/components/AuthButton";
export default function Home() {
  let gotosearch=()=>{
    window.location.href="/searchresult"
  }
  let gotohotellist=()=>{
    window.location.href="/hotellistf"
  }
  let chat=()=>{
    window.location.href="/chat"
  }
  let trips=()=>{
    window.location.href="/trips"
  }
  return (
    <div>
      <AuthButton/>
      <button onClick={gotosearch}>go to search page</button>
      <button onClick={gotohotellist}>go to  search hotel page</button>
      <button onClick={chat}>open ai</button>
      <button onClick={trips}>make trip plan</button>
    </div>
  );
}

