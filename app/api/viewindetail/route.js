import { chromium } from "playwright";
import { NextResponse } from "next/server";
export async function GET(req){
    const {searchParams}=new URL(req.url);
    const hotelname=searchParams.get("query");
    const city=searchParams.get("city");
    
    if(!hotelname){
        return Response.json({images:[]});
    }
    try{
        //web scriping
        // const tokenres = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(hotelname)}&iax=images&ia=images`, {
        //   headers: {
        //     "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        //   }
        //  });
        // const html=await tokenres.text();
        // console.log(html,"this is html");
        // // secotion->ol->li->
        // // figure
        // const photos=html.document.queryselector(figure);
        // console.log(photos,"this is photos ");
        
        const browser=await chromium.launch({
            headless:false
        });
        const page=await browser.newPage();
        await page.goto(`https://duckduckgo.com/?q=${encodeURIComponent(hotelname)}hotel&city=${city} &iax=images&ia=images`,{waitUntil:"domcontentloaded"});
        await page.waitForTimeout(5000);
        const html=await page.content();
        // console.log(html,"is a html");
       const imgs = page.locator('[data-testid="zci-images"] img');

        const imgsurls=await imgs.evaluateAll((imgs)=>{
            return imgs
                .map(img=>img.src)
                .filter(src => {
                    return src.includes("external-content.duckduckgo.com/iu/?u=");//for getting just imgages and skip the logos
                });
        })
        // const imgs=page.locator("#react-layout img");
        // console.log(imgs,"imgs");//we are just selectingn the imgs tagged inside a react laytout couldunt set src for this at this time
        // const imgurls=await imgs.evaluateAll((imgs)=>{
        //     return imgs
        //         .map(img => {
        //             const src = img.src;

        //             try {
        //                 return new URL(src).searchParams.get("u");
        //             } catch {
        //                 return null;
        //             }
        //         })
        //         .filter(src=>src);
        // })
        // console.log(imgsurls[0],"first url of the img");
        // console.log("length of the imgsurls",imgsurls.length);
        console.log("first url of the img",imgsurls[0])
        await browser.close();
        return Response.json({images:imgsurls});

    }
    catch(err){
        console.log("server error",err);
        return Response.json("server error in duckduckgo");
    }
}