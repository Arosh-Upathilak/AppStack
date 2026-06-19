export interface Subscription {
  id: string;
  name: string;
  vendor: string;
  hue: string;
  plan: string;
  price: number;
  cycle: string;
  seats: string;
  renew: string;
  status: 'active' | 'attention' | 'renewing';
  usage: number;
  category: string;
}

export interface Invoice {
  id: string;
  date: string;
  product: string;
  amount: number;
  status: 'paid' | 'overdue';
}

export interface Renewal {
  date: string;
  name: string;
  amount: number;
  tone: 'warn' | 'primary' | 'muted';
  days: number;
}

export interface Product {
  id: string;
  name: string;
  vendor: string;
  hue: string;
  category: string;
  tagline: string;
  rating: number;
  reviews: number;
  from: number;
  popular?: boolean;
  integrations: string[];
  badge?: string;
}

export const SUBSCRIPTIONS: Subscription[] = [
  { id: 'cs-pro', name: 'CloudSync Pro', vendor: 'DataTech Solutions', hue: 'cloudsync', plan: 'Enterprise', price: 1200, cycle: 'mo', seats: '85/100', renew: 'Dec 4', status: 'active', usage: 0.74, category: 'Data Mgmt' },
  { id: 'ts-suite', name: 'TeamSync Suite', vendor: 'CollabSoft Inc.', hue: 'teamsync', plan: '100 Seats', price: 850, cycle: 'mo', seats: '92/100', renew: 'Dec 12', status: 'active', usage: 0.92, category: 'Collaboration' },
  { id: 'sg-net', name: 'SecureGuard Net', vendor: 'CyberDef', hue: 'secureguard', plan: 'Standard', price: 400, cycle: 'mo', seats: '12/25', renew: 'Nov 22', status: 'renewing', usage: 0.48, category: 'Security' },
  { id: 'pg-canvas', name: 'PixelGrid Canvas', vendor: 'Designworks Co.', hue: 'pixelgrid', plan: 'Team', price: 240, cycle: 'mo', seats: '8/10', renew: 'Jan 04', status: 'active', usage: 0.8, category: 'Design' },
  { id: 'mh-base', name: 'MetricSync', vendor: 'Analytica', hue: 'metricsync', plan: 'Pro', price: 149, cycle: 'mo', seats: '6/15', renew: 'Jan 18', status: 'active', usage: 0.40, category: 'Analytics' },
  { id: 'jira', name: 'Jira Software', vendor: 'Atlassian', hue: 'jira', plan: 'Standard', price: 195, cycle: 'mo', seats: '25/25', renew: 'Dec 28', status: 'attention', usage: 1.0, category: 'PM' },
];

export const SPEND_DATA = [2100, 2240, 2380, 2620, 2810, 3050, 3120, 3340, 3690, 3920, 4180, 4250];
export const SPEND_MONTHS = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];

export const INVOICES: Invoice[] = [
  { id: 'INV-2024-1042', date: 'Oct 24, 2024', product: 'CloudSync Pro · Enterprise', amount: 1200, status: 'paid' },
  { id: 'INV-2024-1041', date: 'Oct 22, 2024', product: 'TeamSync Suite · 100 Seats', amount: 850, status: 'paid' },
  { id: 'INV-2024-1037', date: 'Oct 15, 2024', product: 'SecureGuard Net · Standard', amount: 400, status: 'paid' },
  { id: 'INV-2024-1031', date: 'Oct 04, 2024', product: 'PixelGrid Canvas · Team', amount: 240, status: 'paid' },
  { id: 'INV-2024-1029', date: 'Sep 28, 2024', product: 'Jira Software · Standard', amount: 195, status: 'overdue' },
];

export const RENEWALS: Renewal[] = [
  { date: 'Nov 22', name: 'SecureGuard Net', amount: 400, tone: 'warn', days: 8 },
  { date: 'Dec 04', name: 'CloudSync Pro', amount: 1200, tone: 'primary', days: 20 },
  { date: 'Dec 12', name: 'TeamSync Suite', amount: 850, tone: 'primary', days: 28 },
  { date: 'Dec 28', name: 'Jira Software', amount: 195, tone: 'primary', days: 44 },
  { date: 'Jan 04', name: 'PixelGrid Canvas', amount: 240, tone: 'muted', days: 51 },
];

export const PRODUCTS: Product[] = [
  { id: 'cloudsync-pro', name: 'CloudSync Pro', vendor: 'DataTech Solutions', hue: 'cloudsync', category: 'Data Mgmt', tagline: 'Real-time database synchronization across multi-cloud architectures.', rating: 4.8, reviews: 2451, from: 49, popular: true, integrations: ['AWS', 'Azure', 'GCP'], badge: 'Verified Partner' },
  { id: 'teamsync-suite', name: 'TeamSync Suite', vendor: 'CollabSoft Inc.', hue: 'teamsync', category: 'Collaboration', tagline: 'Unified messaging, docs and video for distributed teams.', rating: 4.7, reviews: 1820, from: 12, integrations: ['Slack', 'Zoom'], badge: "Editor's Pick" },
  { id: 'secureguard', name: 'SecureGuard Net', vendor: 'CyberDef', hue: 'secureguard', category: 'Security', tagline: 'Zero-trust network access with continuous compliance auditing.', rating: 4.9, reviews: 940, from: 99, integrations: ['Okta', 'AD'] },
  { id: 'flexaro-crm', name: 'Flexaro CRM', vendor: 'Flexaro Labs', hue: 'flexaro', category: 'CRM', tagline: 'Enterprise-grade CRM with predictive pipeline analytics.', rating: 4.6, reviews: 1320, from: 49, popular: true, integrations: ['Gmail', 'Stripe'], badge: 'Most Popular' },
  { id: 'pixelgrid', name: 'PixelGrid Canvas', vendor: 'Designworks', hue: 'pixelgrid', category: 'Design', tagline: 'Collaborative UI/UX design with real-time component libraries.', rating: 4.6, reviews: 3120, from: 15, integrations: ['Figma', 'Jira'] },
  { id: 'metricsync', name: 'MetricSync', vendor: 'Analytica', hue: 'metricsync', category: 'Analytics', tagline: 'Aggregate marketing data into beautiful, shareable dashboards.', rating: 4.7, reviews: 1180, from: 75, integrations: ['GA4', 'HubSpot'] },
  { id: 'buildmaster', name: 'BuildMaster Pro', vendor: 'CIOps', hue: 'buildmaster', category: 'DevOps', tagline: 'Continuous integration pipelines built for enterprise scale.', rating: 4.5, reviews: 760, from: 99, integrations: ['GitHub', 'Docker'] },
  { id: 'cloudguard', name: 'CloudGuard', vendor: 'NexusOps', hue: 'cloudguard', category: 'DevOps', tagline: 'Automated security policy enforcement for multi-cloud workloads.', rating: 4.6, reviews: 540, from: 199, integrations: ['AWS', 'Terraform'] },
  { id: 'nexus-relate', name: 'Nexus Relate', vendor: 'Nexus Tech', hue: 'nexus', category: 'CRM', tagline: 'Unified customer data platform with intelligent segmentation.', rating: 4.7, reviews: 1990, from: 49, integrations: ['Segment', 'Stripe'] },
];

export const CATEGORIES = ['All', 'CRM', 'DevOps', 'Design', 'Analytics', 'Security', 'Data Mgmt', 'Collaboration'];
