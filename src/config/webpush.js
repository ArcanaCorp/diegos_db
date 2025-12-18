import webpush from "web-push";
import { VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY } from "#src/config.js";

webpush.setVapidDetails(
    "mailto:admin@tuapp.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

export default webpush;