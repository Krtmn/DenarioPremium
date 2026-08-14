import { InventarioProductListComponent } from './inventario-product-list.component';
import { ProductUtil } from 'src/app/modelos/ProductUtil';

describe('InventarioProductListComponent', () => {
  // Evitar TestBed (SQLite/sync DI). Probar filtro visible en aislamiento.
  function createComponentForVisibleFilter(
    products: Partial<ProductUtil>[],
    searchText: string,
  ): InventarioProductListComponent {
    const component = Object.create(
      InventarioProductListComponent.prototype,
    ) as InventarioProductListComponent;
    component.searchText = searchText;
    component.inventoryFilter = 'all';
    component.inventariosLogicService = {
      newClientStock: { productList: products as ProductUtil[] },
    } as any;
    component.isProductInventoriedBySelectedType = () => false;
    return component;
  }

  describe('INV-SEARCH-001 getVisibleProducts accent-insensitive', () => {
    const products = [
      { coProduct: 'A01', naProduct: 'Azúcar refinada' },
      { coProduct: 'A02', naProduct: 'Calorías light' },
      { coProduct: 'B01', naProduct: 'Cafe molido' },
    ];

    it('encuentra Azúcar al buscar sin tilde (azucar)', () => {
      const component = createComponentForVisibleFilter(products, 'azucar');
      const visible = component.getVisibleProducts();
      expect(visible.map(p => p.coProduct)).toEqual(['A01']);
    });

    it('encuentra Azúcar al buscar con tilde (azúcar)', () => {
      const component = createComponentForVisibleFilter(products, 'azúcar');
      const visible = component.getVisibleProducts();
      expect(visible.map(p => p.coProduct)).toEqual(['A01']);
    });

    it('encuentra Calorías al buscar sin tilde (calorias)', () => {
      const component = createComponentForVisibleFilter(products, 'calorias');
      const visible = component.getVisibleProducts();
      expect(visible.map(p => p.coProduct)).toEqual(['A02']);
    });

    it('sin texto de búsqueda muestra todos', () => {
      const component = createComponentForVisibleFilter(products, '');
      expect(component.getVisibleProducts().length).toBe(3);
    });
  });
});
