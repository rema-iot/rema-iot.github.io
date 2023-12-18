import { setCookie, getCookie } from "../../logic/cookies.js";

export function onLoad() {
    // create a coookie with data for the external dashboard
    let originInfo = "cross origin data";
    setCookie("originInfo", originInfo, 1, 'h');
    // set toggle listeners
    setTogglers();
}