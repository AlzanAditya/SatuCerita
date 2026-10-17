export interface UserInvitation {
  id: string;
  title: string;
  brideName: string;
  groomName: string;
  eventDate: string;
  eventLocation: string;
  slug: string;
  templateName: string;
  templateCover: string;
  status: "active" | "draft";
  guestCount: number;
  rsvpCount: number;
}

export interface OrderAddon {
  id: string;
  name: string;
  price: number;
}

export type PaymentMethodId =
  | "qris"
  | "bca_va"
  | "bni_va"
  | "bri_va"
  | "mandiri_va"
  | "permata_va"
  | "gopay";

export interface OrderItem {
  id: string;
  invoiceNo: string;
  date: string;
  dueDate: string;
  status: "pending" | "paid" | "cancelled";
  templateName: string;
  templateCategory: string;
  templateCover: string;
  packageTier: string;
  basePrice: number;
  addons: OrderAddon[];
  discountCode?: string;
  discountAmount?: number;
  uniqueCode: number;
  total: number;
  paymentMethod: PaymentMethodId;
  vaNumber?: string;
  slug: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
}

export type UserAppTab =
  | "home"
  | "task"
  | "proses"
  | "pesanan"
  | "chat"
  | "app"
  | "joki"
  | "katalog"
  | "profile"
  | "bayar"
  | "checkout"
  | "order";

export interface UserAppProps {
  activeTab?: UserAppTab;
  currentPath: string;
  onNavigate: (path: string) => void;
}
