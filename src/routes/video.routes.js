import { Router } from 'express';
import { getAllVideos, publishAVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus } from "../controllers/video.controllers.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/get-allVideos").get(getAllVideos)

router.route("/").post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
            
        ]),
        publishAVideo
    );

router.route("/get-VideoById/:videoId").get(getVideoById);

router.route("/updateVideo-byId/:videoId").patch(upload.single("thumbnail"), updateVideo);

router.route("/deleteVideo-byId/:videoId").delete(deleteVideo);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router