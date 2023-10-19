export function setCookie(cname, cvalue, cend, option) {
  const d = new Date();
  switch (option){
    case 'duration_h': // cookie duration i hours
      d.setTime(d.getTime() + cend * 60 * 60 * 1000); // convert to ms
      break;
    case 'expiration_s': // expiration timestamp in seconds
      d.setTime(cend * 1000);
      break;
    default:
      console.log("undefined expiration cookie option");
  }
  let expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

export function getCookie(cname) {
  let name = cname + "=";
  let ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}