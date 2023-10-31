import { Component } from "./Component.js";

var btn = document.getElementById("btn_create");
var cmp = undefined;

window.onload = () => {
    btn.onclick = createComponent;
}

function createComponent(event) {
    var btn = event.target;
    btn.innerHTML = "Delete component";
    btn.onclick = deleteComponent;

    const compParams = {
        id:"compId",
        prevId:"title",
        title:"Component Name",
        text:"This component is fully controlled by JS."
    }
    cmp = new Component(compParams);
    cmp.render();
}

function deleteComponent() {
    btn.innerHTML = "Create component";
    btn.onclick = createComponent;
    cmp.remove();
}