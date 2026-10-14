
import mongoose from "mongoose";

const placesschema=new mongoose.Schema({
    cityid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"city",
        required:true
        
    },
    name:{
        type:String,
        required:true,
    },
    rating:{
        type:Number,
        min:0,
        max:7,
        required:true,
    },
    kinds:{
        type:[String],
        default:[],
    },
    image:{
        type:String,
        default:null,
    },
    location:{
        latitude:Number,
        longitude:Number,
    },
     externalIds: {
      googlePlaceId: {
        type: String,
        default: null,
      },

      openTripMapXid: {
        type: String,
        default: null,
      },
    },
    metadata:{
        type:mongoose.Schema.Types.Mixed,
        default:{},
    },

},{timestamps:true,});

const place=mongoose.models.place||mongoose.model("place",placesschema);
export default place;