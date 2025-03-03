import dotenv from "dotenv"
import connectDB from "./dB/index.js";
import {app} from "./app.js"

dotenv.config({
    path: './.env'
})

const port = process.env.PORT || 8001;

connectDB()
.then(() => {
    app.listen(port, () => {
        console.log(`⚙️ Server is running at port : ${port}`);
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !! ", err);
})
