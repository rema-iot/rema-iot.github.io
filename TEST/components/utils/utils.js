// params: object with fields {type, className, id, text, parent}

export function create(params) {
        const elem = document.createElement(params.type);
        if (params.text) {
            const textNode = document.createTextNode(params.text);
            elem.appendChild(textNode);
        }
        if (params.id) elem.id = params.id;
        if (params.className) elem.className = params.className;
        if (params.parent) params.parent.appendChild(elem);

        return elem;
    }
