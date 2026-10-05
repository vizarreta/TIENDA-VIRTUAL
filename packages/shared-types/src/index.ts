export interface Category {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  createdAt: Date | string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  role: "customer" | "admin";
}

export interface UserSession {
  access_token: string;
  user: AuthUser;
}

export interface CheckoutInput {
  requestId: string;
  customerName: string;
  shippingAddress: string;
}

export interface SavedOrder {
  id: string;
  customerName: string;
  shippingAddress: string;
  totalCents: number;
  currency: string;
  status: "pending_payment" | "cancelled";
  createdAt: string;
  items: {
    id: number;
    productId: number;
    productName: string;
    unitPriceCents: number;
    quantity: number;
  }[];
}

export interface Product {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  image?: string | null;
  stock: number;
  categoryId?: number | null;
  category?: Category | string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface CartItem {
  id: number;
  cartId: number;
  productId: number;
  quantity: number;
  createdAt: Date | string;
  product?: Product;
}

export interface Cart {
  id: number;
  sessionId?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  items?: CartItem[];
}

export interface CartResponse {
  id: number;
  sessionId?: string;
  items: CartItem[];
  total: number;
  count: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: string;
  addressId?: number;
  shippingAddress?: string;
  status: OrderStatus;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  items?: OrderItem[];
  address?: Address;
  payments?: Payment[];
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  createdAt: Date | string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Address {
  id: number;
  userId: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  createdAt: Date | string;
}

export interface Payment {
  id: number;
  orderId: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  amount: number;
  currency: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type PaymentMethod = "card" | "paypal" | "transfer" | "cash_on_delivery";

export type PaymentStatus =
  "pending" | "processing" | "completed" | "failed" | "refunded";

export interface Invoice {
  id: number;
  orderId: number;
  invoiceNumber: string;
  userId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  taxId?: string;
  businessName?: string;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  discount: number;
  total: number;
  status: InvoiceStatus;
  issuedAt: Date | string;
  pdfUrl?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type InvoiceStatus =
  "draft" | "issued" | "paid" | "cancelled" | "refunded";

export interface Review {
  id: number;
  userId: string;
  productId: number;
  rating: number;
  comment?: string;
  createdAt: Date | string;
}

export interface UserProfile {
  id: string;
  email?: string;
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  role: "customer" | "admin";
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}

export type ProductSearchParams = {
  q?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "name" | "price" | "createdAt";
  sortOrder?: "asc" | "desc";
};
