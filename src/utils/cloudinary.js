import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
import dotenv from "dotenv"

dotenv.config({
    path: "./.env"
});

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Setting Cloudinary cloud name from environment variables
  api_key: process.env.CLOUDINARY_API_KEY,  // Setting Cloudinary API key from environment variables
  api_secret: process.env.CLOUDINARY_API_SECRET // Setting Cloudinary API secret from environment variables
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        // console.log("Clodinary Config", {
        //     cloud_name: process.env.Clodinary_Cloud_Name,
        //     api_key: process.env.Clodinary_API_Key,
        //     api_secret:process.env.Clodinary_API_Secret
        // });

        if (!localFilePath) return null // Return null if no file path is provided
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfull
        console.log("file is uploaded on cloudinary ", response.url);

        // Once the file has been uploaded remove it from the localPath
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

const deleteFromCloudinary = async (publicId, resourceType) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId, 
            { resource_type: resourceType }
        );
        console.log("Successfully deleted from cloudinary : ", publicId);
        return result;
    } catch (error) {
        console.log("Error while deleting from cloudinary", error);
        return null;
    }
}



export { uploadOnCloudinary , deleteFromCloudinary}