var CARD_COUNT = 0;
var CARDS = [];

class Card {
    constructor(params) {
        params.type = "div";
        params.className = "card";

        this.params = params;
        this.elem = createElem(params);
        this.setStyle();

        this.h3 = createElem({
            type: "h3",
            text: this.params.title,
            parent: this.elem
        });
        this.p = createElem({
            type: "p",
            text: this.params.content,
            parent: this.elem
        });
    }
    setStyle(){
        this.elem.style.backgroundColor = "red";
        this.elem.style.color = "white";
        this.elem.style.margin = "10px";
        this.elem.style.padding = "10px";
        this.elem.style.borderRadius = "10px";
    }
};

// create arbitrary element with specified properties
function createElem(params) {
    if (!params.type) return;
    const elem = document.createElement(params.type);
    const keys = Object.keys(params);
    for (var key of keys) {
        console.log(key, ": ", params[key]);
        switch (key) {
            case "text":
                elem.appendChild(document.createTextNode(params.text));
                break;
            case "parent":
                params.parent.appendChild(elem);
            case "type":
                break;
            default:
                elem[key] = params[key];
                break;
        }
    }
    return elem;
}

export function onLoad() {
    let btn = document.getElementById("btn-form");
    btn.onclick = (event) => {
        event.preventDefault();
        let id = "card" + CARD_COUNT;
        let parent = document.getElementById("container-obj");
        let title = document.getElementById("form-title").value;
        let content = document.getElementById("form-description").value;
        let card = new Card({id:id, title:title, content:content, parent:parent});
        CARDS.push(card);
        CARD_COUNT++;
    }
}