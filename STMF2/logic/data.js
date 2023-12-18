import { togglerOpen, logMessage } from "./main.js";
import { SESSION, RINC_API } from "./session.js";
import { getCookie } from "../../JSTK/cookies.js";
import { post } from "../../JSTK/post.js";

let STATION_ID = undefined;
let RAW_DATA = {};
let DATA_IDX = 0;

export function getStationInfo() {
    STATION_ID = getCookie("stationId");
    var data = {
        rqst: 'stationParams',
        sessionId: SESSION.sessionId,
        sessionCk: SESSION.sessionCk,
        stationId: STATION_ID
    };
    logMessage("Solicitando parâmetros da estação");
    post(RINC_API, data, stationInfoCbk);
}

function stationInfoCbk(resp) {
    console.log(resp);
    fillParamsTable(resp);
    createMap(resp);
}

export function getProcessData(){
    logMessage("Solicitando medições da estação");
    STATION_ID = getCookie("stationId");
    var data = {
        rqst: 'measurements',
        sessionId: SESSION.sessionId,
        sessionCk: SESSION.sessionCk,
        stationId: STATION_ID
    };
    post(RINC_API, data, rawDataCbk);
}

function rawDataCbk(resp){
    console.log(resp);
    if (resp.status == 'OK'){
        logMessage("Dados brutos recebidos, " + resp.data.Time.length + " registros");

        conditionRawData(resp.data);
        plotRawData();
        var toggler = document.getElementById("plot-raw-toggler");
        togglerOpen(toggler);

        updateRawCarousel();
    } else {
        logMessage("ERRO: " + resp.msg);
        var toggler = document.getElementById("plot-raw-toggler");
        // toggler.innerText = "⛔";
        toggler.src = "img/error.png"
    }
}

function plotRawData(){
    logMessage("Graficando dados brutos");
    var raw_traces = [];
    for (var key of Object.keys(RAW_DATA)){
        if (key != "Time"){
            raw_traces.push({
                name: key,
                x: RAW_DATA["Time"],
                y: RAW_DATA[key],
                line: { shape: 'spline' },
                type: 'scatter',
            });
        }
    }
    console.log("raw_traces: ");
    console.log(raw_traces);
    var raw_layout = {
        font: { size: 13 },
        showlegend: true,
        legend: {
            x: 0,
            xanchor: 'left',
            y: 1.1
        },
        xaxis: { title: "Tempo" },
        margin: { autoexpand: true},
    };
    var raw_config = { responsive: true };
    Plotly.newPlot('plot-raw', raw_traces, raw_layout, raw_config);

    var elem = document.getElementById("plot-raw");
    elem.setAttribute("data-ready", "ready");
}

function updateRawCarousel(){
    let container = document.getElementById("raw-values");
    for (var key of Object.keys(RAW_DATA)){
        var elem = document.getElementById("box-raw-"+key);
        if (elem){
            for (const child of elem.children) {
                if (child.className == "result"){
                    var val = RAW_DATA[key][DATA_IDX];
                    child.innerText = val.toFixed(2);
                    break;
                }
            }
        } else {
            elem = document.createElement("div");
            elem.classList.add("box");
            //elem.classList.add("carousel-elem");
            var title = document.createElement("h3");
            title.innerText = key;
            elem.appendChild(title);

            elem.appendChild(document.createElement("br"));

            var value = document.createElement("div");
            value.classList.add("result");
            var val = RAW_DATA[key][DATA_IDX];
            value.innerText = val.toFixed(2);
            elem.appendChild(value);

            container.appendChild(elem);
        }
    }
}

function fillParamsTable(resp) {
    if (resp.status == 'OK') {
        logMessage("PARAMS ESTAÇÃO: " + JSON.stringify(resp.data));

        var elem = document.getElementById("station-params-info");
        elem.setAttribute("data-ready", "ready");
        document.getElementById("station-name").innerText = resp.data.name;
        document.getElementById("station-lat").innerText = resp.data.coordLat;
        document.getElementById("station-lon").innerText = resp.data.coordLong;
        document.getElementById("station-flx-cnt").innerText = resp.data.fluxCount;
        document.getElementById("station-hum-cnt").innerText = resp.data.humCount;
        document.getElementById("station-wl-cnt").innerText = resp.data.wlCount;
        document.getElementById("station-freq").innerText = resp.data.sleepTime + ' s';


        // convert unix-time to formatted date
        const creationTime = new Date(resp.data.creationTime * 1000);
        const formattedDate = creationTime.toLocaleDateString('pt-BR', { year: 'numeric', month: 'short', day: 'numeric' });
        document.getElementById("station-act").innerText = formattedDate;

        var toggler = document.getElementById("station-params-toggler");
        togglerOpen(toggler);
    } else {
        var toggler = document.getElementById("station-params-toggler");
        // toggler.innerText = "⛔";
        toggler.src = "img/error.png"
        logMessage("ERRO: " + resp.msg);
    }
}

function createMap(resp) {
    if (resp.status == 'OK') {
        var latitude = resp.data.coordLat;
        var longitude = resp.data.coordLong;
        var delta_lat = 1e-5;
        var delta_lon = 1e-5;
        logMessage("Criando mapa para lat: " + latitude + ", lon: " + longitude);

        var src = "https://www.openstreetmap.org/export/embed.html?bbox="
        src += (latitude) + "%2C" + (longitude) + "%2C" + 
               (latitude) + "%2C" + (longitude) + "&amp;"
        src += "layer=mapnik";
        var frame = document.getElementById("station-map-frame");
        frame.src = src;

        var link = document.getElementById("station-map-link");
        link.href = "https://www.openstreetmap.org/#map=16/" + longitude + "/" + latitude;

        var elem = document.getElementById("station-map-content");
        elem.setAttribute("data-ready", "ready");

        var toggler = document.getElementById("station-map-toggler");
        togglerOpen(toggler);
    } else {
        var toggler = document.getElementById("station-map-toggler");
        // toggler.innerText = "⛔";
        toggler.src = "img/error.png"
    }
}

function conditionRawData(data){
    // create fields
    const keys = Object.keys(data);
    for (key of keys){
        RAW_DATA[key] = [];
    }
    // remove duplicates
    var t0 = undefined;
    for (var i=0; i<data.Time.length; i++){
        // copy only new data to RAW_DATA
        if (data.Time[i] != t0 && data.Time[i] != 0){
            for (var key of keys){
                RAW_DATA[key].push(Number.parseFloat(data[key][i]));
            }
        }
        t0 = data.Time[i];
    }
    console.log("RAW_DATA: ");
    console.log(RAW_DATA);
}