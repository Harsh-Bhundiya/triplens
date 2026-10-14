import mongoose from "mongoose";


let cityschema=mongoose.Schema({
    name:{
        required:true,
        type:"string",
        trim:true,
    },
    state:{
        type:"string",
        required:true,
        trim:true,
    },
    country:{
        type:String,
        required:true,
        trim:true,
    },
     location: {
      latitude: Number,
      longitude: Number,
    },
     metadata: {
      type: mongoose.Schema.Types.Mixed,     //Mixed ka matlab hai is field ke andar MongoDB me almost koi bhi structure rakh sakte ho—string, number, array, object, etc.
      default: {},
    },
    lastfatchedate:Date,


},{timestamps:true,});
cityschema.index({
            name: 1,
            state: 1,
            country: 1,
        },
        {
            unique: true,
        }
)

const city=mongoose.models.city||mongoose.model("city",cityschema);
export default city;
