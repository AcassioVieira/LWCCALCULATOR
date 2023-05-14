public class ProcurarProdutosController {
	/*
     * Método irá buscar lista de produtos que possuem pelo menos um pricebook ativo e que o produto também é ativo.
     * Se o produto tiver mais de um pricebook, o mapa irá garantir que apenas o primeiro pricebook sejá considerado.
     * Cria um mapa { id => produto (id, name, description, unitprice) } que será usado pelo front end para percorrer
     *      os produtos.
     */
    @AuraEnabled(cacheable=true)
    public static Map<Object, Map<Object, Object>> procurarProdutos() {
        List<PricebookEntry> listaCatalogos = [
            SELECT Id, UnitPrice, Product2Id, Product2.Id, Product2.Name, Product2.Description
            FROM PricebookEntry
            WHERE Product2Id != null AND Product2.IsActive = True AND PricebookEntry.IsActive = True
        ];
        Map<Object, Map<Object, Object>> produtosPorId = new Map<Object, Map<Object, Object>>();
        for(PricebookEntry registro : listaCatalogos) {
            if(!produtosPorId.containsKey(registro.Product2Id)) {
                Map<Object, Object> product = new Map<Object, Object>();
                product.put('Id', registro.Product2Id);
                product.put('Name', registro.Product2.Name);
                product.put('Description', registro.Product2.Description);
                product.put('UnitPrice', registro.UnitPrice);
                produtosPorId.put(registro.Product2Id, product);
            }
        }
        return produtosPorId;
    }
}
