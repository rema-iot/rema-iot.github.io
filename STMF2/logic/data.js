import { togglerOpen, logMessage } from "./main.js";
import { SESSION, RINC_API } from "./session.js";
import { getCookie } from "../../JSTK/cookies.js";
import { post } from "../../JSTK/post.js";

let STATION_ID = undefined;
let STN_PARAMS = {};
let RAW_DATA = {};
let FLOW_DATA = {};
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
    if (resp.status == 'OK') {
        const keys = Object.keys(resp.data);
        for (var key of keys) {
            STN_PARAMS[key] = Number.parseFloat(resp.data[key][0]);
        }
        console.log("STN_PARAMS");
        console.log(STN_PARAMS);
    } else {
        logMessage("ERRO: " + resp.msg);
    }
    fillParamsTable(resp.status);
    createMap(resp.status);
}

export function getProcessData() {
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

function rawDataCbk(resp) {
    console.log(resp);
    if (resp.status == 'OK') {
        logMessage("Dados brutos recebidos, " + resp.data.Time.length + " registros");

        conditionRawData(resp.data);
        plotRawData();
        calcHeatFlow();
        plotHeatFlow();

        var toggler_raw = document.getElementById("plot-raw-toggler");
        togglerOpen(toggler_raw);

        var toggler_flow = document.getElementById("plot-flows-toggler");
        togglerOpen(toggler_flow);

        updateRawCarousel();
    } else {
        logMessage("ERRO: " + resp.msg);
        var toggler = document.getElementById("plot-raw-toggler");
        // toggler.innerText = "⛔";
        toggler.src = "img/error.png"
    }
}

function plotRawData() {
    logMessage("Graficando dados brutos");
    var raw_traces = [];
    for (var key of Object.keys(RAW_DATA)) {
        if (key != "Date" && key != "Time" && key != "Boot") {
            raw_traces.push({
                name: key,
                x: RAW_DATA["Date"],
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
        margin: { autoexpand: true },
    };
    var raw_config = { responsive: true };
    Plotly.newPlot('plot-raw', raw_traces, raw_layout, raw_config);

    var elem = document.getElementById("plot-raw");
    elem.setAttribute("data-ready", "ready");
}

function updateRawCarousel() {
    let container = document.getElementById("raw-values");
    for (var key of Object.keys(RAW_DATA)) {
        var elem = document.getElementById("box-raw-" + key);
        if (elem) {
            for (const child of elem.children) {
                if (child.className == "result") {
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
            value.innerText = Number.parseFloat(val).toFixed(2);
            elem.appendChild(value);

            container.appendChild(elem);
        }
    }
}

function fillParamsTable(status) {
    if (status == 'OK') {
        logMessage("PARAMS ESTAÇÃO: " + JSON.stringify(STN_PARAMS));

        var elem = document.getElementById("station-params-info");
        elem.setAttribute("data-ready", "ready");
        document.getElementById("station-name").innerText = STN_PARAMS.name;
        document.getElementById("station-lat").innerText = STN_PARAMS.coordLat;
        document.getElementById("station-lon").innerText = STN_PARAMS.coordLong;
        document.getElementById("station-flx-cnt").innerText = STN_PARAMS.fluxCount;
        document.getElementById("station-flx-array-rad").innerText = STN_PARAMS.radArray + ' m';
        document.getElementById("station-flx-array-dep").innerText = STN_PARAMS.depArray + ' m';
        document.getElementById("station-flx-probe-rad").innerText = STN_PARAMS.radProbe + ' m';
        document.getElementById("station-flx-probe-hei").innerText = STN_PARAMS.heiProbe + ' m';
        document.getElementById("station-hum-cnt").innerText = STN_PARAMS.humCount;
        document.getElementById("station-wl-cnt").innerText = STN_PARAMS.wlCount;
        document.getElementById("station-freq").innerText = STN_PARAMS.sleepTime + ' s';


        // convert unix-time to formatted date
        const creationTime = new Date(STN_PARAMS.creationTime * 1000);
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

function createMap(status) {
    if (status == "OK"){
        var latitude = STN_PARAMS.coordLat;
        var longitude = STN_PARAMS.coordLong;
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

function conditionRawData(data) {
    logMessage("Acondicionando dados brutos");
    // create fields
    const keys = Object.keys(data);
    // add timestamp
    keys.push("Date");

    for (key of keys) {
        RAW_DATA[key] = [];
    }
    // remove duplicates
    var t0 = undefined;
    for (var i = 0; i < data.Time.length; i++) {
        // copy only new data to RAW_DATA
        if (data.Time[i] != t0 && data.Time[i] != 0) {
            for (var key of keys) {
                if (key == "Date") {
                    RAW_DATA[key].push(new Date(data.Time[i] * 1000));
                } else {
                    RAW_DATA[key].push(Number.parseFloat(data[key][i]));
                }
            }
        }
        t0 = data.Time[i];
    }
    console.log("RAW_DATA: ");
    console.log(RAW_DATA);
}

function calcHeatFlow() {
    logMessage("Calculando fluxos de calor");
    FLOW_DATA["Time"] = RAW_DATA["Time"];
    FLOW_DATA["Date"] = RAW_DATA["Date"];
    FLOW_DATA["SN1"] = [];
    FLOW_DATA["WE1"] = [];
    FLOW_DATA["BT1"] = [];
    FLOW_DATA["SN2"] = [];
    FLOW_DATA["WE2"] = [];
    FLOW_DATA["BT2"] = [];
    FLOW_DATA["SN3"] = [];
    FLOW_DATA["WE3"] = [];
    FLOW_DATA["BT3"] = [];
    for (var i = 0; i < FLOW_DATA.Time.length; i++) {
        FLOW_DATA.SN1.push(-STN_PARAMS.soilCond * (RAW_DATA.T1ttn[i] - RAW_DATA.T1tts[i]) / (2 * STN_PARAMS.radProbe));
        FLOW_DATA.WE1.push(-STN_PARAMS.soilCond * (RAW_DATA.T1tbe[i] - RAW_DATA.T1tbw[i]) / (2 * STN_PARAMS.radProbe));
        FLOW_DATA.BT1.push(-STN_PARAMS.soilCond * (RAW_DATA.T1ttn[i] + RAW_DATA.T1tts[i]
            - RAW_DATA.T1tbe[i] + RAW_DATA.T1tbw[i]) / (2 * STN_PARAMS.heiProbe));

        FLOW_DATA.SN2.push(-STN_PARAMS.soilCond * (RAW_DATA.T2ttn[i] - RAW_DATA.T2tts[i]) / (2 * STN_PARAMS.radProbe));
        FLOW_DATA.WE2.push(-STN_PARAMS.soilCond * (RAW_DATA.T2tbe[i] - RAW_DATA.T2tbw[i]) / (2 * STN_PARAMS.radProbe));
        FLOW_DATA.BT2.push(-STN_PARAMS.soilCond * (RAW_DATA.T2ttn[i] + RAW_DATA.T2tts[i]
            - RAW_DATA.T2tbe[i] + RAW_DATA.T2tbw[i]) / (2 * STN_PARAMS.heiProbe));

        FLOW_DATA.SN3.push(-STN_PARAMS.soilCond * (RAW_DATA.T3ttn[i] - RAW_DATA.T3tts[i]) / (2 * STN_PARAMS.radProbe));
        FLOW_DATA.WE3.push(-STN_PARAMS.soilCond * (RAW_DATA.T3tbe[i] - RAW_DATA.T3tbw[i]) / (2 * STN_PARAMS.radProbe));
        FLOW_DATA.BT3.push(-STN_PARAMS.soilCond * (RAW_DATA.T3ttn[i] + RAW_DATA.T3tts[i]
            - RAW_DATA.T3tbe[i] + RAW_DATA.T3tbw[i]) / (2 * STN_PARAMS.heiProbe));
    }
    console.log("RAW_DATA: ");
    console.log(RAW_DATA);
}

function plotHeatFlow() {
    logMessage("Graficando fluxos de calor 3D");
    var traces = [];
    for (var key of Object.keys(FLOW_DATA)) {
        if (key != "Date" && key != "Time") {
            traces.push({
                name: key,
                x: FLOW_DATA["Date"],
                y: FLOW_DATA[key],
                line: { shape: 'spline' },
                type: 'scatter',
            });
        }
    }
    console.log("traces: ");
    console.log(traces);
    var layout = {
        font: { size: 13 },
        showlegend: true,
        legend: {
            x: 0,
            xanchor: 'left',
            y: 1.1
        },
        xaxis: { title: "Tempo" },
        margin: { autoexpand: true },
    };
    var config = { responsive: true };
    Plotly.newPlot("plot-flows", traces, layout, config);

    var elem = document.getElementById("plot-flows");
    elem.setAttribute("data-ready", "ready");
}