import mongoose from "mongoose";


const tripschema=new mongoose.Schema({
    //basic trip info 
    title:{
        type:String,
        required:true,
        trim:true
    },
    destination:{
        type:String,
        required:true,
        trim:true,
    },
    startdate:{
        type:Date,
    },
    enddate:{
        type:Date,
    },
    sharecode:{
        type:String,
        unique:true,
    },
    //creator and members
    createdby:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true, 
    },
    members:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
        },
    ],
    //shortlisted hotels & voting system
    hotels:[
        {
            hotelname:{ type:String,required:true},
            image:String,
            price:String,
            rating:Number,
            address:String,
            suggestby:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"User",
            },
            votes:[
                {
                    user : {type:mongoose.Schema.Types.ObjectId,ref:"User"},
                    votetype:{type:String,enum:["Up","Down"]},
                },
            ],
            isfinalized:{
                type:Boolean,
                default:false,
            },
        },
    ],

    //shortlisted places and day schedule 
    places:[
        {
            placename:{type:String,required:true},
            image:String,
            day:{type:Number,default:1},
            location:{
                latitude:Number,
                longitude:Number,
            },
            suggestedby:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"User",
            },
        },
    ],
    //splitwise expense engine
    expenses:[
        {
            title:{type:String,required:true},
            amount:{type:Number,required:true},
            category:{
                type:String,
                enum:["food","transport","hotel","other","activity"],
                default:"other",
            },   
            paidby:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"User",
                required:true,

            },
            splitamong:[
                {
                    type:mongoose.Schema.Types.ObjectId,
                    ref:"User",
                }
            ],
            date:{
                type:Date,
                default:Date.now,
            }         
        }
        
    ]

},{timestamps:true});

const Trip=mongoose.models.Trip||mongoose.model("Trip",tripschema)

export default Trip;