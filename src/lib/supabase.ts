import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mvcimblwqhyhgjwcxttc.supabase.co';
const supabaseAnonKey = 'sb_publishable_u6Kgixtcl8BAvJxg1KVyBA_SlKxHDDj';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos
export interface Inspection {
  id: string;
  created_at: string;
  updated_at: string;
  status: 'Pendiente' | 'En Revisión' | 'Aprobada' | 'Rechazada' | 'Reinspección';
  client_name: string | null;
  client_id: string | null;
  client_phone: string | null;
  client_email: string | null;
  vehicle_vin: string | null;
  vehicle_plate: string | null;
  vehicle_brand: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  vehicle_color: string | null;
  vehicle_mileage: number | null;
  vehicle_usage: string | null;
  policy_number: string | null;
  policy_type: 'Premium' | 'Standard' | 'Comprehensive';
  policy_status: 'En-Proceso' | 'Emitida' | 'Rechazada' | 'Cancelada';
  risk_score: number;
  quality_score: number;
  accident_type: string | null;
  accident_date: string | null;
  accident_location: string | null;
  client_comments: string | null;
  review_notes: string | null;
  sla_deadline: string | null;
  tags: string[];
  country: string;
}

export interface Damage {
  id: string;
  inspection_id: string;
  part: string;
  type: string;
  severity: 'Leve' | 'Moderado' | 'Severo' | 'Pérdida total';
  confidence: number;
  description: string | null;
  approved: boolean | null;
}

export interface Photo {
  id: string;
  inspection_id: string;
  photo_type: string;
  angle: string | null;
  label: string | null;
  image_url: string | null;
}

// Funciones
export async function getInspections() {
  const { data, error } = await supabase
    .from('inspections')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Inspection[];
}

export async function getInspectionById(id: string) {
  const { data, error } = await supabase
    .from('inspections')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as Inspection;
}

export async function getDamagesByInspection(inspectionId: string) {
  const { data, error } = await supabase
    .from('damages')
    .select('*')
    .eq('inspection_id', inspectionId);
  
  if (error) throw error;
  return data as Damage[];
}

export async function getPhotosByInspection(inspectionId: string) {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('inspection_id', inspectionId);
  
  if (error) throw error;
  return data as Photo[];
}

export async function updateInspectionStatus(id: string, status: Inspection['status'], reviewNotes?: string) {
  const { error } = await supabase
    .from('inspections')
    .update({ 
      status, 
      review_notes: reviewNotes,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
  
  if (error) throw error;
}

export async function updateDamageApproval(id: string, approved: boolean) {
  const { error } = await supabase
    .from('damages')
    .update({ approved })
    .eq('id', id);
  
  if (error) throw error;
}

export async function getStats() {
  const { data, error } = await supabase
    .from('inspections')
    .select('status');
  
  if (error) throw error;
  
  const inspections = data || [];
  return {
    pending: inspections.filter(i => i.status === 'Pendiente').length,
    review: inspections.filter(i => i.status === 'En Revisión').length,
    approved: inspections.filter(i => i.status === 'Aprobada').length,
    reinspection: inspections.filter(i => i.status === 'Reinspección').length,
    avgTime: '2.3h',
    autoApprovalRate: 92,
  };
}
