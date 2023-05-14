/*
 * wire: notação utilizada para referenciar um método que vai ser executado quando o componente for carregado a primeira vez.
 * track: notação usava em variáveis. Por padrão as variáveis já são declaradas como track, porém as primitivas. Quando uma variável é
 *		mais complexa, precisamos colocar a notação track para que o componente fique observando ela, e quando algo mudar dentro dela
 *		ele possa renderizar no frontend. Isso acontece com lista de objetos por exemplo, ou objetos dentro de objetos.
 *		No caso atual a lista de produtos no carrinho possui objetos dentro, e se um valor dentro desse objeto mudar, mas a lista não estiver
 *		com o track apontando, ela não vai observar essas mudanças para renderizar a tabela novamente de produtos na lista novamente com
 *		os dados atualizados.
 */
import { LightningElement, wire, track } from 'lwc';
/*
 * Importa o método procurarProdutos de dentro da classe ProcurarProdutosController, e define o nome do método localmente como procurarProdutos
 */
import procurarProdutos from '@salesforce/apex/ProcurarProdutosController.procurarProdutos';
/* Importa o toast message para podermos utilizar com erros e sucessos. */
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class ProductSearch extends LightningElement {
	/* Vai armazenar o valor do id do produto selecionado pelo dropdown de produtos. */
	produtosPorId;
	/* Será uma lista preenchido pelo método que será carregado ao renderizar a tela para recuperar os produtos, e popular o dropdown. */
	produtosOpcoes;
	/* Dados que vão popular a opção de desconto. No código, ao recuperar o dropdown, o atributo valor, vai ter o valor setado no value. */
	discountOptions = [
		{ value: '0', label: '0%', },
		{ value: '0.05', label: '5%', },
		{ value: '0.10', label: '10%', },
		{ value: '0.15', label: '15%', },
		{ value: '0.20', label: '20%', },
		{ value: '0.25', label: '25%', },
		{ value: '0.30', label: '30%', },
		{ value: '0.35', label: '35%', },
		{ value: '0.40', label: '40%', },
		{ value: '0.45', label: '45%', },
		{ value: '0.50', label: '50%', },
	];

	/* Será preenchido com o id do produto selecionado no dropdown, para recpuerar os dados do produto recuperado da classe Apex. */
	selectedProductId;
	/* Vai ser preenchido com o preço unitário do produto recuperado usando o id do produto selecionado, porém poderá ser mudado pelo usuário. */
	unitPrice;
	/* Campo a ser preenchido pelo usuário para definir quantas unidades do produto ele deseja. */
	quantity;
	/* Vai possuir o valor do desconto selecionado no dropdown de desconto. */
	discountValue = 0;

	/* Vai possuir o valor total do produto selecionado calculando o preço unitário * qunatidade - desconto. */
	totalValue = 0;

	/* Vai armazenar os produtos adicionados a lista de compra, e também serão os valores a serem apresentados na tabela. */
	@track purchaseList;

	/* Método importanto da classe Apex que será executado para recuperar os dados dos produtos e catalogo de preço quando o componente for renderizado. */
	@wire(procurarProdutos)
	procurarProdutos(resposta) {
		if (resposta?.data) {
			this.produtosPorId = resposta?.data;
			this.produtosOpcoes = [];
			/*
			 * Object.values: recupera de um objeto a lista de valores sem chave.
			 * .map: Método do ECMAScript do Javascript, que percorre a lista de objetos.
			 * product é a variável que vai armazenar cada produto recuperado da lista de valores para ser percorrido.
			 */
			Object.values(this.produtosPorId)?.map(
				product => this.produtosOpcoes.push({ value: product.Id, label: product.Name, description: product.Description })
			);
		} else if (resposta?.error) {
			console.warn(resposta?.error);
		}
	}

	/* Será executado sempre que o produto no dropdown tiver seu valor mudado, ou seja um novo produto for selecionado. */
	handleSelectChange(event) {
		this.selectedProductId = event?.detail?.value;
		let product = this.produtosPorId[this.selectedProductId];
		this.unitPrice = product.UnitPrice;
	}

	/* Quando o valor do preço unitário for alterado manualmente pelo usuário, esse método será chamado para definir o novo valor do preço unitário. */
	setUnityPrice(event) {
		this.unitPrice = event?.detail?.value;
	}

	/* Vai definir o novo valor da quantidade quando o usuário alterar o valor manualmente. */
	setQuantity(event) {
		this.quantity = event?.detail?.value;
	}

	/* Define o novo valor do desconto, se o usuário mudar o valor selecionado no dropdown de desconto. */
	setDesconto(event) {
		this.discountValue = event?.detail?.value;
	}

	/*
	 * Método get é um método que serve apenas para pegar valores. Não é possível passar paramêtros, e não usamos () no final. Referenciamos eles
	 * como uma variável e não como um método.
	 */
	/* Método get que recupera valor do preço unitário definida pelo usuário para ser renderizado no front novamente quando o valor mudar. */
	get getUnityPrice() {
		return parseFloat(this.unitPrice || 0).toFixed(2);
	}

	/* Método get que recupera valor da quantidade definida pelo usuário para ser renderizado no front novamente quando o valor mudar. */
	get getQuantity() {
		return this.quantity || 0;
	}

	/* Método get que recupera valor do desconto definido pelo usuário para ser renderizado no front novamente quando o valor mudar. */
	get getDiscountValue() {
		return this.discountValue || 0;
	}

	/* Recupera ao valor total do produto, multiplicando o valor unitário que pode ter sido alterado pelo usuário ou não * quantidade e diminui o desconto. */
	get getProductTotalValue() {
		return (this.unitPrice && this.quantity ? (this.unitPrice * this.quantity) * (1 - this.discountValue) : 0).toFixed(2);
	}

	/* Percorre a lista de produtos no carrinho para calcular o valor e somar, parar gerar o valor total da compra de todos os produtos. */
	get getTotalValue() {
		return (
			this.purchaseList?.reduce(
				(actualValue, product) => (product.UnitPrice * product.Quantity * (1 - product.Discount)) + actualValue, 0
			) || 0
		).toFixed(2);
	}

	/* Recupera a lista de produtos no carrinho. */
	get getPurchaseList() {
		return this.purchaseList || [];
	}

	/* Sempre que o usuário clicar no botão adicionar, esse será o método chamado. */
	addProductPurchaseList() {
		try {
			if (!Array.isArray(this.purchaseList)) { this.purchaseList = []; }
			let product = this.produtosPorId[this.selectedProductId];

			let produtoSelecionado = Boolean(product);
			let produtoQuantidadeErrado = !this.getQuantity;
			let precoErrado = !this.getUnityPrice || this.getUnityPrice <= 0;
			if (!produtoSelecionado || produtoQuantidadeErrado || precoErrado) {
				let message = [];
				if (!produtoSelecionado) { message.push('É necessário selecionar um produto!'); }
				if (produtoQuantidadeErrado) { message.push('A quantidade do produto deve ser maior que zero.'); }
				if (precoErrado) { message.push('O valor do produto não pode ser menor ou igual a zero.'); }
				message = message.join('\n');
				const event = new ShowToastEvent({ title: 'Calculadora de orçamento', message, variant: 'error' });
				this.dispatchEvent(event);
				return;
			}
			this.purchaseList.push({
				Id: this.selectedProductId, Quantity: this.getQuantity,
				UnitPrice: this.getUnityPrice, Discount: this.getDiscountValue, PercentDiscount: this.getDiscountValue * 100,
				Name: product.Name, TotalValue: (this.getUnityPrice * this.getQuantity * (1 - this.getDiscountValue)).toFixed(2)
			});
			const event = new ShowToastEvent({ title: 'Calculadora de orçamento', message: 'Produto adicionado com sucesso!', variant: 'success' });
			this.dispatchEvent(event);
		} catch (e) {
			console.warn(e);
		}
	}

	/* Limpa a lista de produtos no carrinho */
	clearList() {
		this.purchaseList = [];
	}
}
