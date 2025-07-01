import Odoo from 'odoo-xmlrpc';

export interface OdooConfig {
  url: string;
  db: string;
  username: string;
  password: string;
}

export interface OdooProduct {
  id: number;
  name: string;
  description_sale?: string;
  list_price: number;
  standard_price: number;
  qty_available: number;
  barcode?: string;
  default_code?: string; // SKU
  categ_id: [number, string];
  image_1920?: string; // Base64 image
}

export class OdooClient {
  private odoo: any;
  private connected: boolean = false;

  constructor(private config: OdooConfig) {
    this.odoo = new Odoo({
      url: config.url,
      db: config.db,
      username: config.username,
      password: config.password
    });
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    return new Promise((resolve, reject) => {
      this.odoo.connect((err: any) => {
        if (err) {
          console.error('Erro ao conectar com Odoo:', err);
          reject(err);
        } else {
          this.connected = true;
          console.log('Conectado ao Odoo com sucesso');
          resolve();
        }
      });
    });
  }

  async getProducts(limit: number = 100, offset: number = 0): Promise<OdooProduct[]> {
    await this.connect();

    return new Promise((resolve, reject) => {
      const params = {
        ids: [],
        domain: [['sale_ok', '=', true]], // Apenas produtos vendáveis
        fields: [
          'id', 'name', 'description_sale', 'list_price', 
          'standard_price', 'qty_available', 'barcode', 
          'default_code', 'categ_id', 'image_1920'
        ],
        limit: limit,
        offset: offset
      };

      this.odoo.execute_kw('product.product', 'search_read', [params], 
        (err: any, products: OdooProduct[]) => {
          if (err) {
            console.error('Erro ao buscar produtos:', err);
            reject(err);
          } else {
            resolve(products);
          }
        }
      );
    });
  }

  async getProductById(id: number): Promise<OdooProduct | null> {
    await this.connect();

    return new Promise((resolve, reject) => {
      const params = {
        ids: [id],
        fields: [
          'id', 'name', 'description_sale', 'list_price', 
          'standard_price', 'qty_available', 'barcode', 
          'default_code', 'categ_id', 'image_1920'
        ]
      };

      this.odoo.execute_kw('product.product', 'read', [params], 
        (err: any, products: OdooProduct[]) => {
          if (err) {
            console.error('Erro ao buscar produto:', err);
            reject(err);
          } else {
            resolve(products.length > 0 ? products[0] : null);
          }
        }
      );
    });
  }

  async getCategories(): Promise<any[]> {
    await this.connect();

    return new Promise((resolve, reject) => {
      const params = {
        ids: [],
        fields: ['id', 'name', 'parent_id', 'child_id']
      };

      this.odoo.execute_kw('product.category', 'search_read', [params], 
        (err: any, categories: any[]) => {
          if (err) {
            console.error('Erro ao buscar categorias:', err);
            reject(err);
          } else {
            resolve(categories);
          }
        }
      );
    });
  }

  async getStockQuantity(productId: number): Promise<number> {
    await this.connect();

    return new Promise((resolve, reject) => {
      const params = {
        domain: [['product_id', '=', productId]],
        fields: ['quantity', 'location_id']
      };

      this.odoo.execute_kw('stock.quant', 'search_read', [params], 
        (err: any, quants: any[]) => {
          if (err) {
            console.error('Erro ao buscar estoque:', err);
            reject(err);
          } else {
            // Soma todas as quantidades em locais de estoque interno
            const totalQty = quants
              .filter(q => q.location_id[1].includes('Stock'))
              .reduce((sum, q) => sum + q.quantity, 0);
            resolve(totalQty);
          }
        }
      );
    });
  }

  async createSaleOrder(orderData: any): Promise<number> {
    await this.connect();

    return new Promise((resolve, reject) => {
      this.odoo.execute_kw('sale.order', 'create', [[orderData]], 
        (err: any, orderId: number) => {
          if (err) {
            console.error('Erro ao criar pedido:', err);
            reject(err);
          } else {
            resolve(orderId);
          }
        }
      );
    });
  }
}

// Singleton para reutilizar conexão
let odooClient: OdooClient | null = null;

export function getOdooClient(): OdooClient {
  if (!odooClient) {
    odooClient = new OdooClient({
      url: process.env.ODOO_URL || '',
      db: process.env.ODOO_DB || '',
      username: process.env.ODOO_USERNAME || '',
      password: process.env.ODOO_API_KEY || ''
    });
  }
  return odooClient;
}