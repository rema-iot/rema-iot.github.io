class BtnForm extends HTMLButtonElement{
	constructor(action){
		super();
		this.action = action;
		this.addEventListener('click', this.action);
	}
}

customElements.define('btn-form', BtnForm, {extends: 'button'});
