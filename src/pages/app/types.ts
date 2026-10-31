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
  | "bni_va"
  | "bri_va"
  | "permata_va"
  | "mandiri_bill"
  | "qris"
  | "gopay";

export type OrderStatus = "pending" | "paid" | "expired" | "cancelled" | "failed" | "needs_review";

/** Data pesanan dari server (Worker). Tanggal berupa ISO string; format tampilannya dilakukan di UI. */
export interface OrderItem {
  id: string;
  invoiceNo: string;
  date: string;
  dueDate: string;
  paidAt?: string | null;
  status: OrderStatus;
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
  paymentLabel?: string;
  vaNumber?: string;
  bank?: string;
  billerCode?: string;
  billKey?: string;
  qrUrl?: string;
  deeplinkUrl?: string;
  slug: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  /** Hanya ada untuk pesanan pending; dipakai membuka kembali popup pembayaran. */
  snapToken?: string | null;
  environment?: "sandbox" | "production";
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
