import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mvcimblwqhyhgjwcxttc.supabase.co';
const supabaseAnonKey = 'sb_publishable_u6Kgixtcl8BAvJxg1KVyBA_SlKxHDDj';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos completos
export interface Inspection {
  id: string;
  created_at: string;
  updated_at: string;
  status: 'Pendiente' | 'En Revisión' | 'Aprobada' | 'Rechazada' | 'Reinspección';
  
  // Cliente
  client_name: string | null;
  client_id: string | null;
  client_phone: string | null;
  client_email: string | null;
  client_address: string | null;
  client_driver_license: string | null;
  client_id_front_image: string | null;
  client_id_back_image: string | null;
  
  // Vehículo
  vehicle_vin: string | null;
  vehicle_plate: string | null;
  vehicle_brand: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  vehicle_color: string | null;
  vehicle_mileage: number | null;
  vehicle_usage: string | null;
  vehicle_has_garage: boolean;
  
  // Tercero
  has_third_party: boolean;
  third_party_name: string | null;
  third_party_id: string | null;
  third_party_phone: string | null;
  third_party_email: string | null;
  third_party_id_front_image: string | null;
  third_party_id_back_image: string | null;
  
  // Vehículo del tercero
  third_party_vehicle_plate: string | null;
  third_party_vehicle_brand: string | null;
  third_party_vehicle_model: string | null;
  third_party_vehicle_year: number | null;
  third_party_vehicle_color: string | null;
  
  // Póliza
  policy_number: string | null;
  claim_number: string | null;
  policy_type: 'Premium' | 'Standard' | 'Comprehensive';
  policy_status: 'En-Proceso' | 'Emitida' | 'Rechazada' | 'Cancelada';
  
  // Scores
  risk_score: number;
  quality_score: number;
  
  // Accidente
  accident_type: string | null;
  accident_date: string | null;
  accident_location: string | null;
  accident_lat: number | null;
  accident_lng: number | null;
  accident_description: string | null;
  accident_sketch_url: string | null;
  has_witnesses: boolean;
  witness_info: string | null;
  police_present: boolean;
  police_report_number: string | null;
  
  // Comentarios
  client_comments: string | null;
  review_notes: string | null;
  
  // SLA y metadata
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
  photo_url: string | null;
  approved: boolean | null;
}

export interface Photo {
  id: string;
  inspection_id: string;
  photo_type: string;
  category: string | null;
  angle: string | null;
  label: string | null;
  description: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  vehicle_type: string | null;
  latitude: number | null;
  longitude: number | null;
  timestamp: string | null;
}

export interface Consent {
  id: string;
  inspection_id: string;
  person_type: string;
  accepted: boolean;
  signature_url: string | null;
  ip_address: string | null;
  timestamp: string;
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

export async function getConsentByInspection(inspectionId: string) {
  const { data, error } = await supabase
    .from('consents')
    .select('*')
    .eq('inspection_id', inspectionId)
    .maybeSingle();
  
  if (error) throw error;
  return data as Consent | null;
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
