var CARD_COUNT = 0;
var CARDS = [];

class Card {
    constructor(idx, title, content, parent){
        this.type = 'div';
        this.classname = 'card';                // classname in document
        this.id = this.classname + "-" + idx;   // document id
        this.parent = parent;                   // parent node
        this.elem = undefined;                  // DOM object
        this.title = title;
        this.content = content;
    }
    render(){
        console.log("rendering ", this.id, "on ", this.parent.id);
        this.elem = document.createElement(this.type);
        this.elem.classname = this.classname;
        this.elem.id = this.id;

        let h3 = document.createElement("h3");
        let h3_text = document.createTextNode(this.title);
        h3.appendChild(h3_text);

        let p = document.createElement("p");
        let p_text = document.createTextNode(this.content);
        p.appendChild(p_text);

        this.elem.appendChild(h3);
        this.elem.appendChild(p);
        this.parent.appendChild(this.elem);

        console.log("elem: ", this.elem);
    }
};

export function onLoad(){
    let btn = document.getElementById("btn-form");
    btn.onclick = (event)=>{
        event.preventDefault();
        let parent = document.getElementById("container-obj");
        let title = document.getElementById("form-title").innerHTML;
        let content = document.getElementById("form-description").innerHTML;
        let card = new Card(CARD_COUNT, title, content, parent);
        card.render();
        CARDS.push(card);
        CARD_COUNT++;
    }
}