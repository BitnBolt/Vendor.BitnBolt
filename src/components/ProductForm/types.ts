export interface ProductFormData {
  name: string;
  description: string;
  category: string;
  subCategory?: string;
  brand: string;
  basePrice: number;
  profitMargin: number;
  discount: number;
  finalPrice: number;
  stock: number;
  minimumOrderQuantity: number;
  images: string[];
  whatsInTheBox: string[];
  aboutItem: string[];
  features: Array<{ key: string; value: string }>;
  specifications: Array<{ key: string; value: string }>;
  tags: string[];
  shippingInfo: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
  };
  returnPolicy: {
    isReturnable: boolean;
    returnWindow: number;
    returnConditions: string[];
  };
  isPublished: boolean;
}

export type ProductFormErrors = Partial<Record<keyof ProductFormData | 'shippingInfo' | 'images', string>>; 