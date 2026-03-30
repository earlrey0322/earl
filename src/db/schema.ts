// Database types for Supabase tables
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: number;
          email: string;
          password: string;
          full_name: string;
          role: string;
          phone_brand: string | null;
          contact_number: string | null;
          address: string | null;
          worklife_answer: string | null;
          is_subscribed: boolean;
          subscription_plan: string | null;
          subscription_expiry: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "id" | "created_at">;
      };
      charging_stations: {
        Row: {
          id: number;
          name: string;
          company_name: string;
          brand: string;
          owner_id: number | null;
          owner_name: string | null;
          latitude: number;
          longitude: number;
          address: string;
          contact_number: string | null;
          is_active: boolean;
          solar_watts: number;
          battery_level: number;
          views: number;
          view_revenue: number;
          created_at: string;
        };
      };
      notifications: {
        Row: {
          id: number;
          recipient_email: string;
          subject: string;
          message: string;
          type: string;
          is_read: boolean;
          created_at: string;
        };
      };
    };
  };
}
