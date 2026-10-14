import mongoose from "mongoose";

const hotelschema=mongoose.Schema({
    cityid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"city",
        required:true,
    },
    googleplaceid:{
        type:String,
        required:true,
        trim:true,
    },
    name:{
        type:String,
        required:true,
        trim:true,
    },
    rating:{
        type:Number,
        min:0,
        max:5,
        default:null,
    },
    ratingcount:{
        type:Number,
        default:0,
    },
    address:{
        type:String,
        required:true,
    },
    imageurl:{
        type:String,
        default:null,
    },
    location:{
        latitude:{
            type:Number,
            required:true,
        },
        longitude:{
            type:Number,
            required:true,
        }

    },
    phoneno:{
        type:String,
        default:null,
    },
    website:{
        type:String,
        default:null,
    },
    googlemapurl:{
        type:String,
        default:null,
    },
    pricelevel:{
        type:String,
        default:null,
    },
    types:{
        type:[String],
        default:[],
    },
    metadata:{
        type:mongoose.Schema.Types.Mixed,
        default:{}
    }

},{timestamps:true});

const hotel=mongoose.models.hotel ||mongoose.model("hotel",hotelschema);

export default hotel;