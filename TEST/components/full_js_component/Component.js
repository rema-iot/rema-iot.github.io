import {create} from "../utils/utils.js"

// a div with a title and a button
export class Component {
    constructor(params) {
        this.params = params;
        this.container = create({type:"div"});
    }

    render() {
        // create a new div element
        const title = create({type:"h3", parent:this.container, text:this.params.title});
        const parag = create({type:"p", parent:this.container, text:this.params.text});

        // add the newly created element and its content into the DOM
        const prev = document.getElementById(this.params.prevId);
        prev.after(this.container);
    }

    remove() {
        this.container.remove();
    }
};