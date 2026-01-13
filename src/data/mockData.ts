export interface Damage {
  id: string;
  part: string;
  type: string;
  severity: 'Leve' | 'Moderado' | 'Severo';
  confidence: number;
  approved?: boolean;
}

export interface Inspection {
  id: string;
  clientName: string;
  clientId: string;
  clientPhone: string;
  clientEmail: string;
  vehicle: {
    vin: string;
    plate: string;
    brand: string;
    model: string;
    year: number;
    color: string;
    mileage: number;
    usage: string;
  };
  policyType: 'Premium' | 'Standard' | 'Comprehensive';
  policyStatus: 'En-Proceso' | 'Emitida' | 'Rechazada' | 'Cancelada';
  status: 'Pendiente' | 'En Revisión' | 'Aprobada' | 'Rechazada' | 'Reinspección';
  riskScore: number;
  qualityScore: number;
  slaDeadline: string;
  createdAt: string;
  tags: string[];
  damages: Damage[];
  photos: string[];
  clientComments: string;
  reviewNotes: string;
}

export const mockInspections: Inspection[] = [
  {
    id: 'INS-2025-ABC123',
    clientName: 'Juan Carlos Pérez',
    clientId: 'PEPJ850312ABC',
    clientPhone: '+52 55 1234 5678',
    clientEmail: 'juan.perez@email.com',
    vehicle: {
      vin: '1HGBH41JXMN109186',
      plate: 'ABC1234',
      brand: 'Honda',
      model: 'Accord',
      year: 2023,
      color: 'Gris',
      mileage: 45230,
      usage: 'Particular',
    },
    policyType: 'Premium',
    policyStatus: 'En-Proceso',
    status: 'Pendiente',
    riskScore: 72,
    qualityScore: 94,
    slaDeadline: '2025-10-24T09:15:00',
    createdAt: '2025-10-24T06:45:00',
    tags: ['Pendiente', 'high-mileage', 'prior-damage'],
    damages: [
      { id: '1', part: 'Puerta delantera izq.', type: 'Rayón', severity: 'Leve', confidence: 92 },
      { id: '2', part: 'Parachoques frontal', type: 'Abolladura', severity: 'Moderado', confidence: 87 },
      { id: '3', part: 'Llanta trasera der.', type: 'Desgaste', severity: 'Moderado', confidence: 94 },
      { id: '4', part: 'Cofre', type: 'Desportillado pintura', severity: 'Leve', confidence: 89 },
    ],
    photos: Array(12).fill(''),
    clientComments: 'El vehículo ha sido siempre guardado en garage. El rayón de la puerta izquierda fue causado en un estacionamiento. Las llantas fueron cambiadas hace 3 meses.',
    reviewNotes: '',
  },
  {
    id: 'INS-2025-DEF456',
    clientName: 'María González',
    clientId: 'GOMA900515XYZ',
    clientPhone: '+52 33 9876 5432',
    clientEmail: 'maria.gonzalez@email.com',
    vehicle: {
      vin: '2T1BURHE5JC123456',
      plate: 'DEF5678',
      brand: 'Toyota',
      model: 'Camry',
      year: 2022,
      color: 'Blanco',
      mileage: 28500,
      usage: 'Particular',
    },
    policyType: 'Standard',
    policyStatus: 'Emitida',
    status: 'En Revisión',
    riskScore: 45,
    qualityScore: 98,
    slaDeadline: '2025-10-24T10:30:00',
    createdAt: '2025-10-24T07:30:00',
    tags: ['En Revisión'],
    damages: [
      { id: '1', part: 'Espejo derecho', type: 'Rayón menor', severity: 'Leve', confidence: 95 },
    ],
    photos: Array(12).fill(''),
    clientComments: 'Vehículo en excelentes condiciones. Solo tiene un pequeño rayón en el espejo.',
    reviewNotes: '',
  },
  {
    id: 'INS-2025-GHI789',
    clientName: 'Pedro Martínez',
    clientId: 'MARP780620DEF',
    clientPhone: '+52 81 5555 1234',
    clientEmail: 'pedro.martinez@email.com',
    vehicle: {
      vin: '1FA6P8CF5L5123789',
      plate: 'GHI9012',
      brand: 'Ford',
      model: 'Mustang',
      year: 2021,
      color: 'Rojo',
      mileage: 52000,
      usage: 'Particular',
    },
    policyType: 'Comprehensive',
    policyStatus: 'Rechazada',
    status: 'Reinspección',
    riskScore: 88,
    qualityScore: 76,
    slaDeadline: '2025-10-24T08:00:00',
    createdAt: '2025-10-23T14:00:00',
    tags: ['Reinspección', 'missing-photos', 'inconsistent-data'],
    damages: [
      { id: '1', part: 'Parachoques delantero', type: 'Rotura', severity: 'Severo', confidence: 96 },
      { id: '2', part: 'Faro izquierdo', type: 'Destruido', severity: 'Severo', confidence: 98 },
      { id: '3', part: 'Capó', type: 'Deformación', severity: 'Severo', confidence: 94 },
      { id: '4', part: 'Guardafango izq.', type: 'Abolladura', severity: 'Moderado', confidence: 91 },
      { id: '5', part: 'Radiador', type: 'Fuga', severity: 'Severo', confidence: 85 },
    ],
    photos: Array(12).fill(''),
    clientComments: 'Colisión frontal en autopista. El vehículo fue remolcado.',
    reviewNotes: 'Faltan fotos del motor. Datos inconsistentes con el reporte del cliente.',
  },
  {
    id: 'INS-2025-JKL012',
    clientName: 'Ana Silva',
    clientId: 'SILA950830GHI',
    clientPhone: '+52 55 4444 3333',
    clientEmail: 'ana.silva@email.com',
    vehicle: {
      vin: '3N1AB7AP4KY123012',
      plate: 'JKL3456',
      brand: 'Nissan',
      model: 'Sentra',
      year: 2023,
      color: 'Azul',
      mileage: 12000,
      usage: 'Particular',
    },
    policyType: 'Standard',
    policyStatus: 'Cancelada',
    status: 'Pendiente',
    riskScore: 35,
    qualityScore: 92,
    slaDeadline: '2025-10-24T09:45:00',
    createdAt: '2025-10-24T08:00:00',
    tags: ['Pendiente'],
    damages: [],
    photos: Array(12).fill(''),
    clientComments: 'Vehículo nuevo, sin daños previos.',
    reviewNotes: '',
  },
  {
    id: 'INS-2025-MNO345',
    clientName: 'Roberto Hernández',
    clientId: 'HERR881105JKL',
    clientPhone: '+52 33 2222 1111',
    clientEmail: 'roberto.h@email.com',
    vehicle: {
      vin: '5UXWX7C50L0123345',
      plate: 'MNO7890',
      brand: 'BMW',
      model: 'X3',
      year: 2020,
      color: 'Negro',
      mileage: 67000,
      usage: 'Particular',
    },
    policyType: 'Premium',
    policyStatus: 'Emitida',
    status: 'Aprobada',
    riskScore: 55,
    qualityScore: 96,
    slaDeadline: '2025-10-24T11:00:00',
    createdAt: '2025-10-24T05:30:00',
    tags: ['Aprobada'],
    damages: [
      { id: '1', part: 'Puerta trasera der.', type: 'Abolladura menor', severity: 'Leve', confidence: 88, approved: true },
      { id: '2', part: 'Llanta delantera izq.', type: 'Desgaste normal', severity: 'Leve', confidence: 92, approved: true },
    ],
    photos: Array(12).fill(''),
    clientComments: 'Mantenimiento al día. Pequeña abolladura de estacionamiento.',
    reviewNotes: 'Inspección aprobada. Daños menores consistentes con el uso.',
  },
];

export const getStats = () => {
  const pending = mockInspections.filter(i => i.status === 'Pendiente').length;
  const review = mockInspections.filter(i => i.status === 'En Revisión').length;
  const approved = mockInspections.filter(i => i.status === 'Aprobada').length;
  const reinspection = mockInspections.filter(i => i.status === 'Reinspección').length;
  
  return { pending, review, approved, reinspection, avgTime: '2.3h', autoApprovalRate: 92 };
};
