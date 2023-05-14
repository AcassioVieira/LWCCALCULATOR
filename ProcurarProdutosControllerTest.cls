@isTest
class ProcurarProdutosControllerTest {
    /* Método responsável por criar os registros que serão utilizados na classe de teste. */
    @TestSetup
    static void setup() {
        Product2 p = new Product2(Name='Test',Description='Description',IsActive=true);
        insert p;
        /*
         * Não é possível criar um pricebook em classe de teste, por isso a Salesforce disponibiliza
         * esse método para recuperar um id de um pricebook padrão para ser usado nas classes de teste.
         */
        Id pricebookId = Test.getStandardPricebookId();
        PricebookEntry pE = new PricebookEntry(
            UnitPrice=1000,
            Pricebook2Id=pricebookId,
            Product2Id=p.Id,
            IsActive=true
        );
        insert pE;
    }

    /* Teste do método criado. */
    @isTest
    static void procurarProdutos() {
        Product2 p = [SELECT Id FROM Product2 WHERE IsActive = True];

        Test.startTest();
        Map<Object, Map<Object, Object>> productsById = ProcurarProdutosController.procurarProdutos();
        Test.stopTest();

        Assert.isNotNull(productsById?.get(p.Id));
    }
}
