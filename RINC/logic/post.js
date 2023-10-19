// send object to url and process response
export function post(url, obj, callback) {
    var data = { obj: JSON.stringify(obj) }; // must double package the object to prevent CORS error
    // if set contentType to "json": the server rejects the requisition
    var settings = { method: "POST", crossDomain: true, "Access-Control-Allow-Origin": "*", url: url, dataType: "json", data: data, encode: true };
    $.ajax(settings).done(callback);
}