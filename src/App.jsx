import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import {
  BrowserRouter,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import {
  fetchTransactionHistory,
  fetchCompliments,
  createComplimentVoucher,
  generateAiChat,
  generateAiInsight,
  loadExecutiveDashboard,
  loadInventoryCatalog,
  updateInventoryStockCount,
  loadAccountingSystem,
  createAccountingAccount,
  createAccountingJournal,
} from './api';

const DEFAULT_LOGIN = {
  identifier: 'admin@yellocarwash.com',
  password: 'password123',
  token: 'local-admin-session',
  staff: {
    id: 'admin',
    staffid: 1,
    staffname: 'Admin',
    name: 'Admin',
    role: 'admin',
    loginMode: 'local_hardcoded',
  },
};

const NAV_ITEMS = [
  { label: 'Dashboard', icon: 'grid', path: '/summary' },
  { label: 'Members', icon: 'members', path: '/members' },
  { label: 'Inventory', icon: 'inventory', path: '/inventory' },
  { label: 'Stock Opname', icon: 'inventory', path: '/stock-opname' },
  { label: 'Finance', icon: 'ledger', path: '/finance' },
  { label: 'Accounting', icon: 'ledger', path: '/accounting' },
  { label: 'Attendance', icon: 'attendance', path: '/attendance' },
  { label: 'Timetable', icon: 'calendar', path: '/timetable' },
  { label: 'Compliments', icon: 'coupon', path: '/compliments' },
  { label: 'Analytics', icon: 'chart', path: '/analytics' },
  { label: 'AI Assistant', icon: 'bot', path: '/ai-assistant' },
];

const MOBILE_NAV_ITEMS = [
  { label: 'Home', icon: 'grid', path: '/summary' },
  { label: 'Finance', icon: 'ledger', path: '/finance' },
  { label: 'Stock', icon: 'inventory', path: '/stock-opname' },
  { label: 'Compliments', icon: 'coupon', path: '/compliments' },
  { label: 'Stats', icon: 'chart', path: '/analytics' },
  { label: 'Chat', icon: 'bot', path: '/ai-assistant' },
];

const BRANCH_RANKINGS = [
  { rank: 1, unit: 'UNIT_NORTH_GATE', score: 142, efficiency: 98, volume: '+12% VOL', tone: 'up', highlight: true },
  { rank: 2, unit: 'UNIT_DOWNTOWN_X', score: 128, efficiency: 92, volume: '0% VOL', tone: 'flat' },
  { rank: 3, unit: 'UNIT_METRO_VALLEY', score: 115, efficiency: 74, volume: '-4% VOL', tone: 'down' },
  { rank: 4, unit: 'UNIT_EAST_SHORE', score: 94, efficiency: 88, volume: '+2% VOL', tone: 'up' },
];

const DENSITY_BARS = [34, 48, 64, 86, 100, 72, 52, 90, 94, 64, 40, 36];
const DENSITY_LABELS = [
  { index: 0, label: '08:00' },
  { index: 2, label: '10:00' },
  { index: 5, label: '12:00' },
  { index: 8, label: '14:00' },
  { index: 11, label: '16:00' },
];

const AUTO_REFRESH_INTERVAL_MS = 60_000;

const CHAT_PROMPTS = [
  'What should I focus on today?',
  'Summarize the branch list for me.',
  'Any maintenance issue I should know about?',
];

const MEMBER_DIRECTORY_TOTAL = 1284;

const MEMBER_DIRECTORY = [
  {
    id: '88219',
    name: 'Marcus Reed',
    tier: 'ELITE',
    tierTone: 'elite',
    plate: 'XJ-992-K',
    lastVisit: '2026-05-12T14:22:00',
    bay: 'BAY 02',
    status: 'ACTIVE',
    statusTone: 'active',
    memberSince: '2021-03-12',
    phone: '+1 (555) 012-9983',
    email: 'm.reed@corporate.io',
    vehicle: 'Audi RS6 Avant',
    color: 'Nardo Gray',
    points: 4820,
    monthlyWashes: 5.4,
    totalWashes: 128,
    nextBilling: '2026-05-28',
    amountDue: 59900,
    loyaltyProgress: 84,
    notes: 'Prefers ceramic packages and early appointments.',
    recentVisits: [
      { date: '2026-05-12T14:22:00', package: 'CERAMIC SHIELD+', result: 'OPTIMAL', cost: 0 },
      { date: '2026-05-03T09:15:00', package: 'DELUXE JET', result: 'OPTIMAL', cost: 0 },
      { date: '2026-04-24T11:05:00', package: 'PREMIUM FOAM', result: 'SENSOR RE-WASH', cost: 0 },
      { date: '2026-04-14T15:58:00', package: 'CERAMIC SHIELD+', result: 'OPTIMAL', cost: 0 },
    ],
  },
  {
    id: '88402',
    name: 'Sarah Chen',
    tier: 'PRO',
    tierTone: 'pro',
    plate: 'BC-114-Z',
    lastVisit: '2026-05-10T09:15:00',
    bay: 'BAY 01',
    status: 'ACTIVE',
    statusTone: 'active',
    memberSince: '2022-08-09',
    phone: '+1 (555) 018-4410',
    email: 's.chen@corp.io',
    vehicle: 'Tesla Model Y',
    color: 'Pearl White',
    points: 3040,
    monthlyWashes: 3.9,
    totalWashes: 74,
    nextBilling: '2026-06-04',
    amountDue: 29900,
    loyaltyProgress: 61,
    notes: 'Often books before noon and prefers contactless checkout.',
    recentVisits: [
      { date: '2026-05-10T09:15:00', package: 'CERAMIC SHIELD+', result: 'OPTIMAL', cost: 0 },
      { date: '2026-04-26T16:30:00', package: 'DELUXE JET', result: 'OPTIMAL', cost: 0 },
      { date: '2026-04-06T10:10:00', package: 'HAND WAX', result: 'OPTIMAL', cost: 0 },
      { date: '2026-03-28T08:45:00', package: 'QUICK RINSE', result: 'OPTIMAL', cost: 0 },
    ],
  },
  {
    id: '88001',
    name: 'Thomas Hull',
    tier: 'BASIC',
    tierTone: 'basic',
    plate: 'VY-773-M',
    lastVisit: '2026-04-28T11:05:00',
    bay: 'BAY 03',
    status: 'EXPIRED',
    statusTone: 'expired',
    memberSince: '2020-11-19',
    phone: '+1 (555) 019-2201',
    email: 'thull@example.com',
    vehicle: 'Toyota Fortuner',
    color: 'Silver',
    points: 860,
    monthlyWashes: 1.8,
    totalWashes: 41,
    nextBilling: '2026-05-02',
    amountDue: 0,
    loyaltyProgress: 28,
    notes: 'Needs renewal outreach and a reactivation offer.',
    recentVisits: [
      { date: '2026-04-28T11:05:00', package: 'BASIC WASH', result: 'OPTIMAL', cost: 0 },
      { date: '2026-04-09T13:50:00', package: 'BASIC WASH', result: 'OPTIMAL', cost: 0 },
      { date: '2026-03-15T15:10:00', package: 'FOAM RINSE', result: 'OPTIMAL', cost: 0 },
      { date: '2026-02-20T10:00:00', package: 'QUICK RINSE', result: 'OPTIMAL', cost: 0 },
    ],
  },
  {
    id: '88921',
    name: 'Lydia Vance',
    tier: 'ELITE',
    tierTone: 'elite',
    plate: 'ZT-449-P',
    lastVisit: '2026-05-13T15:58:00',
    bay: 'BAY 02',
    status: 'ACTIVE',
    statusTone: 'active',
    memberSince: '2023-01-07',
    phone: '+1 (555) 015-7712',
    email: 'lydia.vance@studio.io',
    vehicle: 'BMW X7',
    color: 'Black Sapphire',
    points: 5180,
    monthlyWashes: 6.2,
    totalWashes: 136,
    nextBilling: '2026-05-21',
    amountDue: 69900,
    loyaltyProgress: 91,
    notes: 'Rewards member with high package mix and consistent upsell adoption.',
    recentVisits: [
      { date: '2026-05-13T15:58:00', package: 'CERAMIC SHIELD+', result: 'OPTIMAL', cost: 0 },
      { date: '2026-05-06T10:35:00', package: 'HAND WAX', result: 'OPTIMAL', cost: 0 },
      { date: '2026-04-25T18:20:00', package: 'DELUXE JET', result: 'OPTIMAL', cost: 0 },
      { date: '2026-04-15T09:05:00', package: 'CERAMIC SHIELD+', result: 'OPTIMAL', cost: 0 },
    ],
  },
  {
    id: '88630',
    name: 'Omar Idris',
    tier: 'PRO',
    tierTone: 'pro',
    plate: 'RX-118-H',
    lastVisit: '2026-05-13T08:33:00',
    bay: 'BAY 04',
    status: 'ACTIVE',
    statusTone: 'active',
    memberSince: '2024-02-18',
    phone: '+1 (555) 014-9091',
    email: 'omar.idris@fleet.io',
    vehicle: 'Honda CR-V',
    color: 'Meteor Gray',
    points: 2140,
    monthlyWashes: 2.7,
    totalWashes: 53,
    nextBilling: '2026-06-08',
    amountDue: 39900,
    loyaltyProgress: 47,
    notes: 'Fleet-style member with steady weekday usage.',
    recentVisits: [
      { date: '2026-05-13T08:33:00', package: 'QUICK DETAIL', result: 'OPTIMAL', cost: 0 },
      { date: '2026-05-01T12:05:00', package: 'DELUXE JET', result: 'OPTIMAL', cost: 0 },
      { date: '2026-04-20T08:55:00', package: 'BASIC WASH', result: 'OPTIMAL', cost: 0 },
      { date: '2026-04-07T09:18:00', package: 'HAND WAX', result: 'OPTIMAL', cost: 0 },
    ],
  },
  {
    id: '88441',
    name: 'Aji Pranata',
    tier: 'BASIC',
    tierTone: 'basic',
    plate: 'DQ-441-S',
    lastVisit: '2026-05-11T10:42:00',
    bay: 'BAY 01',
    status: 'ACTIVE',
    statusTone: 'active',
    memberSince: '2025-05-03',
    phone: '+62 812-3344-1100',
    email: 'aji.pranata@mail.com',
    vehicle: 'Toyota Avanza',
    color: 'Red',
    points: 620,
    monthlyWashes: 2.1,
    totalWashes: 27,
    nextBilling: '2026-05-29',
    amountDue: 19900,
    loyaltyProgress: 22,
    notes: 'Price sensitive, responds well to basic wash bundles.',
    recentVisits: [
      { date: '2026-05-11T10:42:00', package: 'BASIC WASH', result: 'OPTIMAL', cost: 0 },
      { date: '2026-04-22T16:12:00', package: 'QUICK RINSE', result: 'OPTIMAL', cost: 0 },
      { date: '2026-04-03T09:30:00', package: 'BASIC WASH', result: 'OPTIMAL', cost: 0 },
      { date: '2026-03-17T13:18:00', package: 'FOAM RINSE', result: 'OPTIMAL', cost: 0 },
    ],
  },
];

const getSelectedThroughputBucket = (dashboard, selectedIndex) => {
  const buckets = dashboard?.throughputBars || [];

  if (!buckets.length) {
    return null;
  }

  const normalizedIndex = Math.max(0, Math.min(selectedIndex, DENSITY_BARS.length - 1));
  const mappedIndex = Math.round((normalizedIndex / Math.max(DENSITY_BARS.length - 1, 1)) * (buckets.length - 1));

  return buckets[mappedIndex] || null;
};

const formatRupiah = (value) =>
  `Rp${Number(value || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;

const formatPercentValue = (value, fractionDigits = 0) =>
  `${Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}%`;

const parseNumericValue = (value) => {
  if (value === null || typeof value === 'undefined' || value === '') {
    return 0;
  }

  const normalized = String(value).replace(/[^0-9.-]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getBranchStoreId = (branch) =>
  branch?.storeId ?? branch?.store_ID ?? branch?.id ?? null;

const formatHourLabel = (hour) => `${String(hour).padStart(2, '0')}:00`;

const formatTransactionTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const getTransactionBranchId = (transaction) =>
  transaction?.store_id ?? transaction?.storeId ?? transaction?.branchId ?? transaction?.branch_id ?? null;

const getTransactionServiceNames = (transaction) => {
  if (!Array.isArray(transaction?.items)) {
    return ['Unknown Service'];
  }

  const names = transaction.items
    .map((item) => String(item.itemname || item.name || item.serviceType || '').trim())
    .filter(Boolean);

  return names.length ? names : ['Unknown Service'];
};

const formatClockLabel = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const formatHoursValue = (seconds = 0) => {
  const hours = Number(seconds || 0) / 3600;
  return `${hours.toFixed(1)} hrs`;
};

const getTopRevenueService = (dashboard) => {
  const breakdown = Array.isArray(dashboard?.revenueBreakdown) ? dashboard.revenueBreakdown : [];
  return breakdown.length ? breakdown[0] : null;
};

const buildAnalyticsStats = (dashboard) => {
  const branchLocations = Array.isArray(dashboard?.branchLocations) ? dashboard.branchLocations : [];
  const branchCount = branchLocations.length;
  const revenueToday = Number(dashboard?.revenueToday || 0);
  const revenueMonth = Number(dashboard?.revenueMonth || 0);
  const monthlyExpenses = Number(dashboard?.monthlyExpenses || 0);
  const activeServices = Number(dashboard?.activeServices || 0);
  const completedToday = Number(dashboard?.completedToday || 0);
  const profitMargin = Number(dashboard?.profitMargin || 0);
  const weeklyEstimate = Number(dashboard?.weeklyEstimate || 0);
  const topService = getTopRevenueService(dashboard);
  const topServiceShare = Number(topService?.percentage || 0);
  const monthlyTarget = branchLocations.reduce((sum, branch) => sum + parseNumericValue(branch.monthlyTarget), 0);
  const targetProgress = monthlyTarget > 0 ? Math.min((revenueMonth / monthlyTarget) * 100, 100) : 0;
  const flowBase = completedToday + activeServices;
  const flowScore = flowBase > 0 ? Math.round((completedToday / flowBase) * 100) : 0;

  return [
    {
      label: 'TOP SERVICE SHARE',
      value: topService ? formatPercentValue(topServiceShare, 1) : 'N/A',
      subtext: topService?.serviceType || 'NO SERVICE MIX DATA',
      bar: topServiceShare,
      tone: topServiceShare > 70 ? 'bad' : topServiceShare > 50 ? 'sand' : 'blue',
    },
    {
      label: 'PROFIT MARGIN',
      value: formatPercentValue(profitMargin, 1),
      subtext: `EXPENSES ${formatRupiah(monthlyExpenses)}`,
      bar: Math.max(0, Math.min(profitMargin, 100)),
      tone: profitMargin >= 35 ? 'green' : profitMargin >= 15 ? 'sand' : 'bad',
    },
    {
      label: 'OPERATIONS LOAD',
      value: String(completedToday || 0),
      subtext: `${activeServices} ACTIVE • ${branchCount} BRANCHES • WEEKLY ${formatRupiah(weeklyEstimate)}`,
      bar: Math.max(0, Math.min(flowScore, 100)),
      tone: flowScore >= 75 ? 'green' : flowScore >= 40 ? 'sand' : 'blue',
    },
    {
      label: 'MONTH TARGET',
      value: formatPercentValue(targetProgress, 1),
      subtext: monthlyTarget > 0 ? `${formatRupiah(revenueMonth)} / ${formatRupiah(monthlyTarget)}` : 'TARGET NOT LOADED',
      bar: Math.max(0, Math.min(targetProgress, 100)),
      tone: targetProgress >= 75 ? 'green' : targetProgress >= 40 ? 'sand' : 'blue',
    },
  ];
};

const buildFinanceOverview = (dashboard) => {
  const revenueToday = Number(dashboard?.revenueToday || 0);
  const revenueMonth = Number(dashboard?.revenueMonth || 0);
  const monthlyExpenses = Number(dashboard?.monthlyExpenses || 0);
  const weeklyEstimate = Number(dashboard?.weeklyEstimate || 0);
  const completedToday = Number(dashboard?.completedToday || 0);
  const activeServices = Number(dashboard?.activeServices || 0);
  const branchLocations = Array.isArray(dashboard?.branchLocations) ? dashboard.branchLocations : [];
  const branchTargets = branchLocations.reduce((sum, branch) => sum + parseNumericValue(branch.monthlyTarget), 0);
  const grossProfit = revenueMonth - monthlyExpenses;
  const margin = revenueMonth > 0 ? (grossProfit / revenueMonth) * 100 : Number(dashboard?.profitMargin || 0);
  const projectedMonthEnd = weeklyEstimate > 0 ? Math.round(weeklyEstimate * 4.33) : revenueMonth;
  const targetGap = Math.max(branchTargets - revenueMonth, 0);
  const cashInBank = Math.max(grossProfit + (revenueToday * 3), 0);
  const receivables = Math.round(Math.max(revenueMonth * 0.12, revenueToday * 2));
  const payables = Math.round(Math.max(monthlyExpenses * 0.28, revenueToday * 0.9));

  return {
    revenueToday,
    revenueMonth,
    monthlyExpenses,
    weeklyEstimate,
    completedToday,
    activeServices,
    branchLocations,
    branchTargets,
    grossProfit,
    margin,
    projectedMonthEnd,
    targetGap,
    cashInBank,
    receivables,
    payables,
  };
};

const buildFinanceRows = (overview) => {
  const incomeRows = [
    { label: 'Wash service revenue', value: overview.revenueMonth, tone: 'good' },
    { label: 'Daily counter revenue', value: overview.revenueToday, tone: 'good' },
    { label: 'Projected weekly run rate', value: overview.weeklyEstimate, tone: 'blue' },
  ];
  const expenseRows = [
    { label: 'Chemical and consumables', value: Math.round(overview.monthlyExpenses * 0.34), tone: 'warn' },
    { label: 'Labor and shift costs', value: Math.round(overview.monthlyExpenses * 0.42), tone: 'warn' },
    { label: 'Utilities and maintenance', value: Math.round(overview.monthlyExpenses * 0.24), tone: 'warn' },
  ];

  return { incomeRows, expenseRows };
};

const buildLedgerRows = (overview) => [
  {
    code: '4000',
    account: 'Sales revenue',
    debit: 0,
    credit: overview.revenueMonth,
    status: 'POSTED',
  },
  {
    code: '5000',
    account: 'Operating expenses',
    debit: overview.monthlyExpenses,
    credit: 0,
    status: 'ACCRUED',
  },
  {
    code: '1010',
    account: 'Cash in bank',
    debit: overview.cashInBank,
    credit: 0,
    status: 'RECONCILED',
  },
  {
    code: '1200',
    account: 'Customer receivables',
    debit: overview.receivables,
    credit: 0,
    status: 'OPEN',
  },
  {
    code: '2100',
    account: 'Supplier payables',
    debit: 0,
    credit: overview.payables,
    status: 'DUE',
  },
];

const formatMemberDate = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
};

const formatMemberDateTime = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return `${date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

const sanitizeCode39Value = (value) => String(value || '')
  .toUpperCase()
  .replace(/[^A-Z0-9\-\.\$\/\+\% ]/g, '')
  .trim();

const getComplimentStatusTone = (status = '') => {
  const value = String(status).toUpperCase();
  if (value.includes('READY')) return 'good';
  if (value.includes('ACTIVE')) return 'good';
  if (value.includes('EXPIRE')) return 'warn';
  return 'bad';
};

const getMemberTierTone = (tier = '') => {
  const value = String(tier).toUpperCase();
  if (value === 'ELITE') return 'gold';
  if (value === 'PRO') return 'blue';
  return 'slate';
};

const getMemberStatusTone = (status = '') => {
  const value = String(status).toUpperCase();
  if (value === 'ACTIVE') return 'good';
  if (value === 'EXPIRING') return 'warn';
  return 'bad';
};

const getMemberInitials = (member = {}) => {
  const parts = String(member.name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return parts.length ? parts.map((part) => part[0]).join('').toUpperCase() : 'MB';
};

const buildAttendanceRows = (records = []) => {
  const grouped = new Map();

  records.forEach((record, index) => {
    const userId = record?.user?.id ?? record?.user?.code ?? record?.user?.first_name ?? record?.datetime ?? index;
    const key = String(userId);
    const current = grouped.get(key) || {
      key,
      user: record?.user || {},
      events: [],
    };

    current.events.push(record);
    grouped.set(key, current);
  });

  return [...grouped.values()]
    .map((group) => {
      const events = group.events
        .slice()
        .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

      const clockInEvent = events.find((event) => Number(event.status) === 1) || null;
      const clockOutEvent = [...events].reverse().find((event) => Number(event.status) === 0) || null;
      const breakEvent = events.find((event) => Number(event.status) === 2) || null;
      const latestEvent = events[events.length - 1] || null;
      const checkIn = clockInEvent?.datetime || null;
      const checkOut = clockOutEvent?.datetime || null;
      const hasClockOut = Boolean(clockOutEvent);
      const hasClockIn = Boolean(clockInEvent);
      const statusKey = hasClockOut ? 'complete' : hasClockIn ? 'open' : 'absent';
      const statusLabel = hasClockOut ? 'COMPLETED' : hasClockIn ? 'ON-SITE' : 'ABSENT';
      const statusTone = hasClockOut ? 'good' : hasClockIn ? 'warn' : 'bad';
      const displayName = `${String(group.user?.first_name || '').trim()} ${String(group.user?.last_name || '').trim()}`.trim()
        || `User ${group.user?.id || 'Unknown'}`;
      const staffCode = group.user?.code || group.user?.id || `ID-${String(group.key).slice(-4)}`;
      const locationTitle = latestEvent?.location?.title || clockInEvent?.location?.title || 'Unknown Location';

      return {
        key: group.key,
        user: group.user,
        events,
        displayName,
        staffCode,
        locationTitle,
        checkIn,
        checkOut,
        breakEvent: breakEvent?.datetime || null,
        statusKey,
        statusLabel,
        statusTone,
        latestEventTime: latestEvent?.datetime || null,
      };
    })
    .sort((a, b) => new Date(b.latestEventTime || 0).getTime() - new Date(a.latestEventTime || 0).getTime());
};

const buildTimetableAssignments = (sections = [], limit = 4) => {
  const items = [];

  sections.forEach((section) => {
    (section.items || []).forEach((item) => {
      items.push({
        day: section.title,
        time: item.time,
        text: item.text,
        sectionKey: section.key || section.title,
      });
    });
  });

  return items.slice(0, limit);
};

const toYmd = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseRosterDate = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const buildRosterDateKeys = (records = [], dateStart = null, dateEnd = null) => {
  const startDate = parseRosterDate(dateStart);
  const endDate = parseRosterDate(dateEnd);

  if (startDate && endDate && endDate >= startDate) {
    const keys = [];
    const cursor = new Date(startDate);

    while (cursor <= endDate) {
      keys.push(toYmd(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    return keys;
  }

  const keySet = new Set();

  records.forEach((record) => {
    Object.keys(record?.dates || {}).forEach((key) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
        keySet.add(key);
      }
    });
  });

  return [...keySet].sort();
};

const formatRosterDateLabel = (value) => {
  const date = parseRosterDate(value);

  if (!date) {
    return String(value || '').toUpperCase();
  }

  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).replace(',', '').toUpperCase();
};

const formatRosterHeaderParts = (value) => {
  const date = parseRosterDate(value);

  if (!date) {
    return {
      weekday: String(value || '').slice(0, 3).toUpperCase(),
      day: '--',
    };
  }

  return {
    weekday: date.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase(),
    day: String(date.getDate()).padStart(2, '0'),
  };
};

const formatRosterMonthLabel = (dateStart, dateEnd) => {
  const start = parseRosterDate(dateStart);
  const end = parseRosterDate(dateEnd);

  if (!start && !end) {
    return 'CLOCKSTER ROSTER';
  }

  if (start && end && start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return start.toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric',
    }).toUpperCase();
  }

  if (start && end) {
    return `${start.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }).toUpperCase()} - ${end
      .toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
      .toUpperCase()}`;
  }

  return (start || end).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  }).toUpperCase();
};

const formatRosterCell = (dayValue = {}) => {
  const schedule = dayValue?.schedule || {};
  const hasSchedule = Boolean(
    schedule && (schedule.time_start || schedule.time_end || schedule.title || schedule.type || schedule.leave_type)
  );
  const isLeave = schedule.type === 'leave' || Boolean(schedule.leave_type);
  const attendanceCount = Array.isArray(dayValue?.attendance) ? dayValue.attendance.length : 0;
  const inTime = dayValue?.in ? formatClockLabel(dayValue.in) : null;
  const outTime = dayValue?.out ? formatClockLabel(dayValue.out) : null;

  let title = 'NO DATA';
  let detail = 'NO SCHEDULE';
  let tone = 'empty';
  let badge = 'EMPTY';

  if (isLeave) {
    title = String(schedule.title || 'LEAVE').toUpperCase();
    detail = String(schedule.leave_type || 'DAY OFF').replace(/_/g, ' ').toUpperCase();
    tone = 'bad';
    badge = 'LEAVE';
  } else if (hasSchedule) {
    title = String(schedule.title || schedule.type || 'WORK').toUpperCase();
    if (schedule.time_start && schedule.time_end) {
      detail = `${String(schedule.time_start).slice(0, 5)} - ${String(schedule.time_end).slice(0, 5)}`;
    } else {
      detail = 'TIME NOT SET';
    }
    tone = attendanceCount > 0 || inTime || outTime ? 'good' : 'warn';
    badge = 'WORK';
  }

  const attendanceLabel = [
    inTime ? `IN ${inTime}` : null,
    outTime ? `OUT ${outTime}` : null,
  ]
    .filter(Boolean)
    .join(' • ') || (attendanceCount > 0 ? `${attendanceCount} ATTENDANCE${attendanceCount > 1 ? 'S' : ''}` : detail);

  return {
    title,
    detail,
    badge,
    tone,
    attendanceLabel,
  };
};

const buildClocksterRosterRows = (records = [], { dateStart = null, dateEnd = null } = {}) => {
  const dateKeys = buildRosterDateKeys(records, dateStart, dateEnd);

  const rows = records
    .map((record, index) => {
      const user = record?.user || {};
      const firstName = String(user.first_name || '').trim();
      const lastName = String(user.last_name || '').trim();
      const displayName = `${firstName} ${lastName}`.trim() || `User ${user.id || index + 1}`;
      const staffCode = user.code || user.id || `ID-${String(index + 1).padStart(2, '0')}`;

      const cells = dateKeys.map((dateKey) => {
        const dayValue = record?.dates?.[dateKey] || null;
        const rosterCell = formatRosterCell(dayValue || {});

        return {
          key: dateKey,
          ...rosterCell,
          dayValue,
        };
      });

      const workCount = cells.filter((cell) => cell.tone === 'good' || cell.tone === 'warn').length;
      const leaveCount = cells.filter((cell) => cell.tone === 'bad').length;
      const emptyCount = cells.filter((cell) => cell.tone === 'empty').length;
      const primaryRole = workCount > 0
        ? 'SHIFT MEMBER'
        : leaveCount > 0
          ? 'DAY OFF'
          : 'UNASSIGNED';

      return {
        key: String(user.id || user.code || index),
        user,
        displayName,
        staffCode,
        primaryRole,
        cells,
        workCount,
        leaveCount,
        emptyCount,
      };
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  return {
    dateKeys,
    rows,
  };
};

const toInputDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
};

const getMonthRangeFromDate = (value) => {
  const date = value instanceof Date ? value : new Date(`${toInputDate(value)}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    const fallback = new Date();
    return {
      start: toInputDate(new Date(fallback.getFullYear(), fallback.getMonth(), 1)),
      end: toInputDate(new Date(fallback.getFullYear(), fallback.getMonth() + 1, 0)),
    };
  }

  return {
    start: toInputDate(new Date(date.getFullYear(), date.getMonth(), 1)),
    end: toInputDate(new Date(date.getFullYear(), date.getMonth() + 1, 0)),
  };
};

const AUTH_STORAGE_KEYS = {
  token: 'token',
  staff: 'staff',
};

const readJson = (value) => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const getStoredSession = () => {
  if (typeof window === 'undefined') {
    return { token: '', staff: null };
  }

  return {
    token: window.localStorage.getItem(AUTH_STORAGE_KEYS.token) || '',
    staff: readJson(window.localStorage.getItem(AUTH_STORAGE_KEYS.staff)),
  };
};

function LoadingState() {
  return (
    <div className="ops-shell ops-shell-loading">
      <div className="loading-card">
        <div className="loading-badge">YELLOW CAR WASH</div>
        <div className="loading-title">SYNCING BACKEND SIGNALS</div>
        <div className="loading-copy">Connecting to live API and preparing command center panels...</div>
      </div>
    </div>
  );
}

function LoginView({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState(DEFAULT_LOGIN.identifier);
  const [password, setPassword] = useState(DEFAULT_LOGIN.password);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const isValidLogin =
        String(identifier || '').trim().toLowerCase() === DEFAULT_LOGIN.identifier &&
        String(password || '') === DEFAULT_LOGIN.password;

      if (!isValidLogin) {
        throw new Error('Invalid login. Use the default admin credentials.');
      }

      const nextStaff = DEFAULT_LOGIN.staff;
      window.localStorage.setItem(AUTH_STORAGE_KEYS.token, DEFAULT_LOGIN.token);
      window.localStorage.setItem(AUTH_STORAGE_KEYS.staff, JSON.stringify(nextStaff));
      onLoginSuccess({ token: DEFAULT_LOGIN.token, staff: nextStaff });
      navigate('/summary', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-shell">
      <section className="login-hero">
        <div className="login-brand">
          <div className="login-brand-mark">YCW</div>
          <div>
            <div className="login-brand-title">YELLOW CAR WASH</div>
            <div className="login-brand-subtitle mono">AI EXECUTIVE COMMAND INTERFACE</div>
          </div>
        </div>

        <div className="login-copy">
          <div className="login-kicker mono">LOCAL ADMIN SIGN-IN</div>
          <h1>Access the home dashboard with the default admin credentials.</h1>
          <p>
            This login skips the auth request and uses the built-in admin account:
            <span className="mono"> admin@yellocarwash.com / password123</span>.
          </p>
        </div>

        <div className="login-signal-grid">
          <div className="login-signal-card">
            <span className="login-signal-label">LIVE DATA STREAMS</span>
            <strong>ACTIVE</strong>
          </div>
          <div className="login-signal-card">
            <span className="login-signal-label">HOME ROUTE</span>
            <strong>/summary</strong>
          </div>
          <div className="login-signal-card">
            <span className="login-signal-label">CURRENCY</span>
            <strong>Rp</strong>
          </div>
        </div>
      </section>

      <section className="login-card">
        <div className="login-card-head">
          <div className="login-card-title">SIGN IN</div>
          <div className="login-card-subtitle mono">ENTER STAFF CREDENTIALS</div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span>Email / Staff No / Phone / Name</span>
            <input
              type="text"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="admin@yellocarwash.com"
              autoComplete="username"
              required
            />
          </label>

          <label className="login-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>

          {error ? <div className="login-error">{error}</div> : null}

          <button className="primary-btn login-submit" type="submit" disabled={submitting}>
            {submitting ? 'AUTHENTICATING...' : 'ENTER HOME'}
          </button>
        </form>
      </section>
    </div>
  );
}

function RankCard({ item }) {
  return (
    <article className={`rank-card ${item.highlight ? 'rank-card-highlight' : ''}`}>
      <div className="rank-head">
        <div className="rank-code">#{String(item.rank).padStart(2, '0')}</div>
        <div className={`eff-pill eff-${item.efficiency >= 90 ? 'good' : item.efficiency >= 80 ? 'warn' : 'bad'}`}>
          {item.efficiency}% EFF
        </div>
      </div>
      <div className="rank-unit">{item.unit}</div>
      <div className="rank-score">{item.score}</div>
      <div className="rank-foot">
        <span className={`rank-volume rank-volume-${item.tone}`}>{item.volume}</span>
      </div>
    </article>
  );
}

function BranchCard({ branch, index, selected, onClick }) {
  const displayName = branch.name || branch.code || branch.location || branch.address || `Branch ${index + 1}`;
  const displayCode = branch.code || branch.id || `#${String(index + 1).padStart(2, '0')}`;
  const displayLocation = branch.location || branch.address || branch.raw?.city || branch.raw?.area || 'Branch location unavailable';
  const displayPhone = branch.phone || branch.raw?.telephone || branch.raw?.contact || '';

  return (
    <button
      type="button"
      className={`branch-card branch-card-button ${selected ? 'branch-card-selected' : ''}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      <div className="branch-card-top">
        <div>
          <div className="branch-card-code">{String(displayCode).toUpperCase()}</div>
          <div className="branch-card-name">{displayName}</div>
        </div>
        <div className="branch-card-index">#{String(index + 1).padStart(2, '0')}</div>
      </div>
      <div className="branch-card-location">{displayLocation}</div>
      {displayPhone ? <div className="branch-card-phone mono">{displayPhone}</div> : null}
      <div className="branch-card-footer mono">
        {selected ? 'ACTIVE PREVIEW' : 'CLICK TO FILTER'}
      </div>
    </button>
  );
}

function DensityChart({ dashboard, selectedIndex, onSelectIndex }) {
  const tallest = Math.max(...DENSITY_BARS, 1);
  const safeIndex = Math.max(0, Math.min(selectedIndex ?? 0, DENSITY_BARS.length - 1));
  const selectedValue = DENSITY_BARS[safeIndex];
  const selectedBucket = getSelectedThroughputBucket(dashboard, safeIndex);
  const selectedLabel = selectedBucket?.time || DENSITY_LABELS.find((item) => item.index === safeIndex)?.label || `BAR ${safeIndex + 1}`;
  const selectedRealTime = Number(selectedBucket?.realTime ?? selectedValue);
  const selectedHistorical = Number(selectedBucket?.historical ?? Math.max(Math.round(selectedValue * 0.82), 0));
  const delta = selectedRealTime - selectedHistorical;
  const deltaTone = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
  const deltaText = `${delta >= 0 ? '+' : ''}${delta} VEHICLES`;
  const availableBuckets = Array.isArray(dashboard?.throughputBars) && dashboard.throughputBars.length
    ? dashboard.throughputBars
    : DENSITY_LABELS.map((label, index) => ({
        time: label.label,
        realTime: DENSITY_BARS[index] || 0,
        historical: Math.max(Math.round((DENSITY_BARS[index] || 0) * 0.82), 0),
      }));
  const peakBucket = availableBuckets.reduce((best, current) => {
    const bestValue = Number(best?.realTime || 0);
    const currentValue = Number(current?.realTime || 0);
    return currentValue > bestValue ? current : best;
  }, availableBuckets[0]);
  const averageRealTime = Math.round(
    availableBuckets.reduce((sum, bucket) => sum + Number(bucket.realTime || 0), 0) / Math.max(availableBuckets.length, 1)
  );
  const averageHistorical = Math.round(
    availableBuckets.reduce((sum, bucket) => sum + Number(bucket.historical || 0), 0) / Math.max(availableBuckets.length, 1)
  );
  const averageDelta = averageRealTime - averageHistorical;
  const peakLabel = peakBucket?.time || selectedLabel;
  const reportTone = averageDelta > 0 ? 'up' : averageDelta < 0 ? 'down' : 'flat';
  const suggestionText = averageDelta > 0
    ? `Traffic is running above baseline. Put more staff on ${peakLabel} and keep the wash lanes clear.`
    : averageDelta < 0
      ? `Traffic is below baseline. Use ${selectedLabel} for prep work, bundling, or light maintenance.`
      : `Traffic is balanced with baseline. Keep staffing steady and monitor the peak slot around ${peakLabel}.`;

  return (
    <div className="panel chart-panel">
      <div className="panel-head">
        <div>
          <div className="panel-title">REAL-TIME VEHICLE DENSITY</div>
          <div className="panel-subtitle mono">CLICK ANY BAR TO INSPECT THE TIME SLOT</div>
        </div>
        <div className="panel-meta">UPDATED: 2M AGO</div>
      </div>

      <div className="density-chart" aria-label="Real-time vehicle density chart">
        {DENSITY_BARS.map((bar, index) => {
          const active = index === 8;
          const selected = index === safeIndex;
          const height = Math.max((bar / tallest) * 100, 20);

          return (
            <div key={`${bar}-${index}`} className="density-bar-wrap">
              <button
                type="button"
                className={`density-bar-button ${selected ? 'selected' : ''}`}
                onClick={() => onSelectIndex(index)}
                aria-pressed={selected}
                aria-label={`Inspect density bar ${index + 1}`}
              >
                <div className={`density-bar ${active ? 'active' : ''}`} style={{ height: `${height}%` }} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="density-labels">
        {DENSITY_LABELS.map((label) => (
          <span key={label.label} style={{ gridColumnStart: label.index + 1 }}>
            {label.label}
          </span>
        ))}
      </div>

      <div className="density-report">
        <div className="density-report-head">
          <div>
            <div className="density-report-title">CHART OVERVIEW</div>
            <div className="density-report-subtitle mono">AUTO SUMMARY FROM LIVE VEHICLE SIGNALS</div>
          </div>
          <div className={`density-report-badge density-report-badge-${reportTone} mono`}>
            {peakBucket?.time || 'LIVE'}
          </div>
        </div>

        <div className="density-report-grid">
          <div className="density-report-item">
            <span>PEAK SLOT</span>
            <strong>{peakLabel}</strong>
          </div>
          <div className="density-report-item">
            <span>AVG REAL-TIME</span>
            <strong>{averageRealTime}</strong>
          </div>
          <div className="density-report-item">
            <span>AVG DELTA</span>
            <strong className={`density-detail-delta density-detail-delta-${reportTone}`}>{averageDelta >= 0 ? '+' : ''}{averageDelta}</strong>
          </div>
        </div>

        <div className="density-report-copy mono">{suggestionText}</div>
      </div>

      <div className="density-detail">
        <div className="density-detail-top">
          <div>
            <div className="density-detail-label">SELECTED SLOT</div>
            <div className="density-detail-title">{selectedLabel}</div>
          </div>
          <button type="button" className="density-detail-reset" onClick={() => onSelectIndex(8)}>
            RESET TO PEAK
          </button>
        </div>

        <div className="density-detail-grid">
          <div className="density-detail-metric">
            <span>REAL-TIME</span>
            <strong>{selectedRealTime}</strong>
          </div>
          <div className="density-detail-metric">
            <span>HISTORICAL</span>
            <strong>{selectedHistorical}</strong>
          </div>
          <div className="density-detail-metric">
            <span>DELTA</span>
            <strong className={`density-detail-delta density-detail-delta-${deltaTone}`}>{deltaText}</strong>
          </div>
        </div>

        <div className="density-detail-copy mono">
          {dashboard
            ? `LIVE BACKEND SIGNALS ARE ${delta >= 0 ? 'ABOVE' : 'BELOW'} THE EXPECTED TREND FOR THIS SLOT.`
            : 'CLICK A BAR TO INSPECT SLOT-LEVEL THROUGHPUT DETAILS.'}
        </div>
      </div>
    </div>
  );
}

function TransactionPerHourPanel({
  dashboard,
  branchLocations,
  selectedBranchId,
  selectedBranch,
  onSelectBranch,
  onClearBranch,
}) {
  const todayKey = toInputDate(new Date());
  const [transactionDate, setTransactionDate] = useState(todayKey);
  const [plateNoFilter, setPlateNoFilter] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedHour, setSelectedHour] = useState(12);

  const activeBranchId = selectedBranchId === null || typeof selectedBranchId === 'undefined'
    ? null
    : selectedBranchId;
  const branchSelectValue = activeBranchId !== null ? String(activeBranchId) : 'all';
  const scopeLabel = selectedBranch?.name || dashboard?.scopeLabel || 'COMPANY PREVIEW';
  const plateSearch = plateNoFilter.trim();

  useEffect(() => {
    let cancelled = false;

    const loadTransactions = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await fetchTransactionHistory({
          startDate: transactionDate,
          endDate: transactionDate,
          storeId: activeBranchId,
          search: plateSearch,
        });

        if (cancelled) {
          return;
        }

        setTransactions(Array.isArray(data) ? data : []);
      } catch (fetchError) {
        console.error('Failed to load transaction history', fetchError);
        if (!cancelled) {
          setError('Failed to load transaction chart.');
          setTransactions([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadTransactions();

    return () => {
      cancelled = true;
    };
  }, [activeBranchId, transactionDate, plateSearch]);

  const filteredTransactions = useMemo(() => {
    if (!plateSearch) {
      return transactions;
    }

    const needle = plateSearch.toUpperCase();
    return transactions.filter((transaction) =>
      String(transaction.nopolisi || '').toUpperCase().includes(needle)
    );
  }, [plateSearch, transactions]);

  const hourlyBuckets = useMemo(() => {
    const buckets = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      label: formatHourLabel(hour),
      count: 0,
      transactions: [],
    }));

    filteredTransactions.forEach((transaction) => {
      const date = new Date(transaction.datetransact);
      if (Number.isNaN(date.getTime())) {
        return;
      }

      const hour = date.getHours();
      const bucket = buckets[hour];
      if (!bucket) {
        return;
      }

      bucket.count += 1;
      bucket.transactions.push(transaction);
    });

    return buckets;
  }, [filteredTransactions]);

  const peakBucket = useMemo(() => {
    return hourlyBuckets.reduce((best, bucket) => {
      if (!best || bucket.count > best.count) {
        return bucket;
      }

      return best;
    }, hourlyBuckets[0] || { hour: 0, label: '00:00', count: 0, transactions: [] });
  }, [hourlyBuckets]);

  useEffect(() => {
    if (hourlyBuckets.length) {
      setSelectedHour(peakBucket?.hour ?? 0);
    }
  }, [peakBucket?.hour, transactionDate, activeBranchId, plateSearch, hourlyBuckets.length]);

  const selectedBucket = hourlyBuckets[selectedHour] || hourlyBuckets[0];
  const selectedTransactions = useMemo(() => {
    return (selectedBucket?.transactions || [])
      .slice()
      .sort((left, right) => new Date(right.datetransact).getTime() - new Date(left.datetransact).getTime());
  }, [selectedBucket]);

  const selectedRevenue = selectedTransactions.reduce((sum, transaction) => sum + Number(transaction.total || 0), 0);
  const peakCount = Math.max(...hourlyBuckets.map((bucket) => bucket.count), 1);

  const handleBranchChange = (event) => {
    const nextValue = event.target.value;

    if (nextValue === 'all') {
      onClearBranch();
      return;
    }

    const nextBranch = branchLocations.find((branch) => String(getBranchStoreId(branch) ?? '') === nextValue);
    if (nextBranch) {
      onSelectBranch(nextBranch);
    }
  };

  return (
    <section className="panel summary-transaction-panel">
      <div className="panel-head">
        <div>
          <div className="panel-title">TRANSACTION PER HOUR</div>
          <div className="panel-subtitle mono">BRANCH AND DATE FILTERS WITH CLICK-TO-DETAIL TRANSACTIONS</div>
        </div>
        <div className="panel-meta">{scopeLabel}</div>
      </div>

      <div className="transaction-toolbar">
        <label className="transaction-filter">
          <span className="mono">BRANCH</span>
          <select className="transaction-select" value={branchSelectValue} onChange={handleBranchChange}>
            <option value="all">All Branches</option>
            {branchLocations.map((branch, index) => {
              const branchId = getBranchStoreId(branch);
              const branchLabel = branch.name || branch.code || branch.location || `Branch ${index + 1}`;
              return (
                <option key={`${branchId ?? index}`} value={String(branchId ?? '')}>
                  {branchLabel}
                </option>
              );
            })}
          </select>
        </label>

        <label className="transaction-filter">
          <span className="mono">DATE</span>
          <input
            type="date"
            className="transaction-date-input"
            value={transactionDate}
            onChange={(event) => setTransactionDate(event.target.value)}
          />
        </label>

        <label className="transaction-filter">
          <span className="mono">PLAT NO</span>
          <input
            type="text"
            className="transaction-plate-input"
            value={plateNoFilter}
            onChange={(event) => setPlateNoFilter(event.target.value)}
            placeholder="B 1234 XYZ"
            autoComplete="off"
          />
        </label>
      </div>

      {loading ? (
        <div className="transaction-loading mono">Loading transaction history...</div>
      ) : error ? (
        <div className="transaction-empty mono">{error}</div>
      ) : (
        <>
          <div className="transaction-chart-scroll">
            <div className="transaction-chart" aria-label="Transaction per hour chart">
              {hourlyBuckets.map((bucket) => {
                const selected = bucket.hour === selectedHour;
                const height = Math.max((bucket.count / peakCount) * 100, bucket.count > 0 ? 12 : 4);

                return (
                  <button
                    key={bucket.hour}
                    type="button"
                    className={`transaction-bar-button ${selected ? 'transaction-bar-button-selected' : ''}`}
                    onClick={() => setSelectedHour(bucket.hour)}
                    aria-pressed={selected}
                    aria-label={`Inspect transactions for ${bucket.label}`}
                  >
                    <span className="transaction-bar-label mono">{bucket.hour % 3 === 0 ? bucket.label : ''}</span>
                    <span className={`transaction-bar ${selected ? 'transaction-bar-selected' : ''}`} style={{ height: `${height}%` }} />
                    <span className="transaction-bar-count mono">{bucket.count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="transaction-detail">
            <div className="transaction-detail-head">
              <div>
                <div className="transaction-detail-title">{selectedBucket?.label || '00:00'}</div>
                <div className="transaction-detail-subtitle mono">
                  {selectedBucket?.count || 0} TRANSACTIONS • {formatRupiah(selectedRevenue)}
                </div>
              </div>
              <div className="transaction-detail-badge mono">
                {selectedBucket?.count || 0} / {filteredTransactions.length}
              </div>
            </div>

            {selectedTransactions.length ? (
              <div className="transaction-list">
                {selectedTransactions.slice(0, 12).map((transaction) => {
                  const services = getTransactionServiceNames(transaction);
                  const transactionTotal = Number(transaction.total || 0);
                  return (
                    <article key={`${transaction.transactionid || transaction.tiketno || transaction.datetransact}`} className="transaction-card">
                      <div className="transaction-card-head">
                        <div>
                          <div className="transaction-card-ticket">{transaction.tiketno || transaction.transactionid || 'NO TICKET'}</div>
                          <div className="transaction-card-time mono">{formatTransactionTime(transaction.datetransact)}</div>
                        </div>
                        <div className="transaction-card-total">{formatRupiah(transactionTotal)}</div>
                      </div>
                      <div className="transaction-card-plate mono">
                        {transaction.nopolisi || 'NO PLATE'}
                      </div>
                      <div className="transaction-card-services">
                        {services.join(', ')}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="transaction-empty mono">NO TRANSACTIONS FOUND FOR THIS HOUR.</div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function RingCard({ percent, status }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="panel ring-panel">
      <div className="panel-head">
        <div className="panel-title">MONTHLY PROGRESS</div>
      </div>
      <div
        className="ring-chart"
        style={{ background: `conic-gradient(#ffd21e 0 ${clamped * 3.6}deg, #2d2d2d ${clamped * 3.6}deg 360deg)` }}
      >
        <div className="ring-inner">
          <div className="ring-value">{clamped}%</div>
        </div>
      </div>
      <div className="ring-status">{status}</div>
    </div>
  );
}

function StatCard({ item }) {
  return (
    <div className="panel stat-card">
      <div className="panel-title stat-label">{item.label}</div>
      <div className="stat-value">{item.value}</div>
      <div className="stat-subtext">{item.subtext}</div>
      <div className="stat-track">
        <div
          className={`stat-fill stat-fill-${item.tone}`}
          style={{ width: `${item.bar}%` }}
        />
      </div>
    </div>
  );
}

function DailyIncomePreview({ dashboard }) {
  const revenueData = Array.isArray(dashboard?.revenueAnalytics?.revenueData)
    ? dashboard.revenueAnalytics.revenueData
    : [];
  const weeklyQty = Number(dashboard?.revenueAnalytics?.totalServices || dashboard?.completedToday || 0);
  const weeklyEstimate = Number(dashboard?.weeklyEstimate || 0);
  const [hoveredPointKey, setHoveredPointKey] = useState(null);
  const formatQty = (value) => Number(value || 0).toLocaleString('en-US');

  const fallbackSeries = useMemo(() => {
    const baseValue = weeklyQty > 0
      ? weeklyQty / 7
      : weeklyEstimate > 0
        ? weeklyEstimate / 7
        : Number(dashboard?.completedToday || 0);
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

    return days.map((label, index) => ({
      key: `fallback-${label}`,
      label,
      value: Math.max(0, Math.round(baseValue * (0.84 + index * 0.04))),
      qty: 0,
    }));
  }, [dashboard, weeklyEstimate, weeklyQty]);

  const series = useMemo(() => {
    const mapped = revenueData
      .map((item, index) => {
        const periodValue = Number(item?.period);
        const label = Number.isFinite(periodValue)
          ? String(periodValue).padStart(2, '0')
          : String(item?.period || `D${index + 1}`).toUpperCase();

        return {
          key: `${label}-${index}`,
          label,
          value: Number(item?.services || 0),
          qty: Number(item?.services || 0),
        };
      })
      .sort((left, right) => {
        const leftNumber = Number(left.label);
        const rightNumber = Number(right.label);

        if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
          return leftNumber - rightNumber;
        }

        return left.label.localeCompare(right.label);
      });

    return mapped.length ? mapped : fallbackSeries;
  }, [fallbackSeries, revenueData]);

  const chartStats = useMemo(() => {
    const total = series.reduce((sum, point) => sum + Number(point.value || 0), 0);
    const peak = series.reduce((best, point) => (Number(point.value || 0) > Number(best?.value || 0) ? point : best), series[0] || null);
    const average = series.length ? total / series.length : 0;

    return {
      total,
      peak,
      average,
    };
  }, [series]);

  const width = 980;
  const height = 300;
  const paddingX = 38;
  const paddingY = 28;
  const maxValue = Math.max(...series.map((point) => Number(point.value || 0)), 1);
  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingY * 2;
  const chartPoints = series.map((point, index) => {
    const x = series.length > 1
      ? paddingX + (usableWidth * index) / (series.length - 1)
      : width / 2;
    const value = Number(point.value || 0);
    const y = height - paddingY - (value / maxValue) * usableHeight;
    return { ...point, x, y };
  });

  const linePath = chartPoints.length
    ? chartPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ')
    : '';
  const areaPath = chartPoints.length
    ? `${linePath} L ${chartPoints[chartPoints.length - 1].x.toFixed(2)} ${height - paddingY} L ${chartPoints[0].x.toFixed(2)} ${height - paddingY} Z`
    : '';
  const yAxisMarks = [0.25, 0.5, 0.75];
  const trendLabel = revenueData.length ? 'BACKEND DAILY QTY' : 'ESTIMATED DAILY QTY';
  const peakLabel = chartStats.peak?.label || 'N/A';
  const totalQty = series.reduce((sum, point) => sum + Number(point.value || 0), 0);
  const hoveredPoint = chartPoints.find((point) => point.key === hoveredPointKey) || chartStats.peak || chartPoints[chartPoints.length - 1] || null;
  const hoveredPointStyle = hoveredPoint
    ? {
        left: `${(hoveredPoint.x / width) * 100}%`,
        top: `${(hoveredPoint.y / height) * 100}%`,
      }
    : null;

  return (
    <div className="summary-ops-card summary-ops-card-income">
      <div className="summary-ops-head">
        <div>
          <div className="summary-ops-title">DAILY QTY</div>
          <div className="summary-ops-subtitle mono">{trendLabel}</div>
        </div>
        <div className="summary-ops-count mono">{series.length} DAYS</div>
      </div>

      <div
        className="income-chart-shell"
        onMouseLeave={() => setHoveredPointKey(null)}
      >
        <div className="income-chart-grid" aria-hidden="true">
          {yAxisMarks.map((mark, index) => (
            <span
              key={`${mark}-${index}`}
              className="income-chart-grid-line"
              style={{ top: `${mark * 100}%` }}
            />
          ))}
        </div>

        <svg className="income-chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Daily income line chart">
          {chartPoints.length ? (
            <>
              {yAxisMarks.map((mark, index) => (
                <line
                  key={`line-${index}`}
                  x1={paddingX}
                  x2={width - paddingX}
                  y1={(height - paddingY) - mark * usableHeight}
                  y2={(height - paddingY) - mark * usableHeight}
                  className="income-chart-axis-line"
                />
              ))}
              <path className="income-chart-area" d={areaPath} />
              <path className="income-chart-line" d={linePath} />
              {chartPoints.map((point) => (
                <g
                  key={point.key}
                  role="button"
                  tabIndex={0}
                  aria-label={`${point.label} revenue ${formatRupiah(point.value || 0)} with ${point.services || 0} services`}
                  onMouseEnter={() => setHoveredPointKey(point.key)}
                  onFocus={() => setHoveredPointKey(point.key)}
                  onBlur={() => setHoveredPointKey(null)}
                  onTouchStart={() => setHoveredPointKey(point.key)}
                >
                  <circle className="income-chart-point-ring" cx={point.x} cy={point.y} r="11" />
                  <circle className="income-chart-point" cx={point.x} cy={point.y} r="5" />
                </g>
              ))}
            </>
          ) : null}
        </svg>

        {hoveredPoint ? (
          <div className="income-tooltip" style={hoveredPointStyle}>
          <div className="income-tooltip-label mono">{hoveredPoint.label}</div>
            <div className="income-tooltip-value">{formatQty(hoveredPoint.value || 0)}</div>
            <div className="income-tooltip-meta mono">
              QTY
            </div>
          </div>
        ) : null}

        <div className="income-chart-labels">
          {chartPoints.map((point, index) => (
            <span key={point.key} className={index === chartPoints.length - 1 ? 'income-chart-label-active' : ''}>
              {point.label}
            </span>
          ))}
        </div>
      </div>

      <div className="income-summary-strip">
        <div className="income-summary-item">
          <div className="income-summary-label mono">TOTAL MONTH</div>
          <div className="income-summary-value">{formatQty(chartStats.total || 0)}</div>
        </div>
        <div className="income-summary-item">
          <div className="income-summary-label mono">AVERAGE / DAY</div>
          <div className="income-summary-value">{formatQty(chartStats.average || 0)}</div>
        </div>
        <div className="income-summary-item">
          <div className="income-summary-label mono">PEAK DAY</div>
          <div className="income-summary-value">{peakLabel}</div>
          <div className="income-summary-note mono">{formatQty(chartStats.peak?.value || 0)}</div>
        </div>
        <div className="income-summary-item">
          <div className="income-summary-label mono">TOTAL QTY</div>
          <div className="income-summary-value">{formatQty(totalQty)}</div>
        </div>
      </div>
    </div>
  );
}

function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <nav className="nav-stack" aria-label="Primary">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path
            || (item.path === '/summary' && location.pathname === '/')
            || (item.path === '/members' && location.pathname.startsWith('/members'))
            || (item.path === '/finance' && location.pathname.startsWith('/finance'))
            || (item.path === '/compliments' && location.pathname.startsWith('/compliments'));

          return (
            <NavLink key={item.label} to={item.path} className={`nav-item ${isActive ? 'active' : ''}`}>
              <span className={`nav-icon nav-icon-${item.icon}`} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-status">
        <div className="sidebar-status-title">SYSTEM STATUS</div>
        <div className="sidebar-status-row">
          <span className="status-led" />
          <span>ALL NODES ACTIVE</span>
        </div>
      </div>
    </aside>
  );
}

function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile primary">
        {MOBILE_NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path
            || (item.path === '/summary' && location.pathname === '/')
            || (item.path === '/finance' && location.pathname.startsWith('/finance'))
            || (item.path === '/ai-assistant' && location.pathname.startsWith('/ai-assistant'))
            || (item.path === '/compliments' && location.pathname.startsWith('/compliments'));

        return (
          <NavLink key={item.label} to={item.path} className={`mobile-bottom-nav-item ${isActive ? 'active' : ''}`}>
            <span className={`nav-icon nav-icon-${item.icon}`} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

function Header({ operatorName, operatorRole, topRightStatus, onExportPdf, onGenerateInsight, onLogout, refreshing }) {
  return (
    <header className="top-header">
      <div className="brand-lockup">
        <div className="brand-icon">▣</div>
        <div className="brand-text">YELLOW CAR WASH</div>
      </div>

      <div className="operator-lockup">
        <div className="operator-copy">
          <div className="operator-name">{operatorName}</div>
          <div className="operator-state">{operatorRole}</div>
        </div>
        <div className="operator-avatar">
          <div className="operator-avatar-ring" />
        </div>
      </div>

      <div className="header-actions">
        <button className="ghost-btn" onClick={onExportPdf}>EXPORT PDF</button>
        <button className="ghost-btn" onClick={onLogout}>LOGOUT</button>
        <button className="primary-btn" onClick={onGenerateInsight} disabled={refreshing}>
          {refreshing ? 'GENERATING...' : 'GENERATE INSIGHT'}
        </button>
      </div>
    </header>
  );
}

function SummaryView({
  dashboard,
  selectedBranch,
  selectedBranchId,
  onSelectBranch,
  onClearBranch,
  attendanceDate,
  onAttendanceDateChange,
}) {
  const branchLocations = dashboard?.branchLocations || [];
  const derivedSelectedBranch = selectedBranch
    || branchLocations.find((branch) => String(getBranchStoreId(branch)) === String(selectedBranchId ?? ''))
    || null;
  const scopeLabel = derivedSelectedBranch?.name || dashboard?.scopeLabel || 'COMPANY PREVIEW';
  const monthlyTarget = derivedSelectedBranch
    ? parseNumericValue(derivedSelectedBranch.monthlyTarget)
    : branchLocations.reduce((sum, branch) => sum + parseNumericValue(branch.monthlyTarget), 0);
  const monthlyRevenue = Number(dashboard?.revenueMonth || 0);
  const today = new Date();
  const currentMonthDay = Math.max(today.getDate(), 1);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const forecastIncome = monthlyRevenue > 0
    ? Math.round((monthlyRevenue / currentMonthDay) * daysInMonth)
    : 0;
  const monthlyTargetAchievement = monthlyTarget > 0
    ? Math.min((monthlyRevenue / monthlyTarget) * 100, 100)
    : 0;
  const monthlyTargetRemaining = Math.max(monthlyTarget - monthlyRevenue, 0);
  const forecastVsTarget = monthlyTarget > 0
    ? Math.min((forecastIncome / monthlyTarget) * 100, 999)
    : 0;
  const targetScopeLabel = derivedSelectedBranch ? 'BRANCH MONTHLY TARGET' : 'COMPANY MONTHLY TARGET';
  const summaryCards = [
    { title: 'TODAY REVENUE', value: formatRupiah(dashboard?.revenueToday || 0), sub: 'Live from sales.stats' },
    { title: 'ACTIVE SERVICES', value: String(dashboard?.activeServices || 0), sub: 'Currently in progress' },
    { title: 'COMPLETED TODAY', value: String(dashboard?.completedToday || 0), sub: 'Finished service count' },
  ];

  return (
    <>
      <div className="route-grid route-grid-summary summary-desktop-shell">
      <section className="panel summary-panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">SUMMARY</div>
            <div className="panel-subtitle mono">OPERATIONAL OVERVIEW AND LIVE BRANCH STATUS</div>
          </div>
          <div className="summary-scope">
            <div className="summary-scope-label mono">CURRENT VIEW</div>
            <div className="summary-scope-value">{scopeLabel}</div>
            {derivedSelectedBranch ? (
              <button type="button" className="scope-clear-btn mono" onClick={onClearBranch}>
                SHOW ALL BRANCHES
              </button>
            ) : (
              <div className="scope-clear-btn scope-clear-btn-static mono">COMPANY PREVIEW</div>
            )}
          </div>
        </div>

        <div className="summary-card-grid">
          {summaryCards.map((item) => (
            <div key={item.title} className="summary-card">
              <div className="summary-label">{item.title}</div>
              <div className="summary-value">{item.value}</div>
              <div className="summary-subtext">{item.sub}</div>
            </div>
          ))}
        </div>

        <div className="summary-target-card">
          <div className="summary-target-head">
            <div>
              <div className="summary-label">{targetScopeLabel}</div>
              <div className="summary-target-value">
                {monthlyTarget > 0 ? `${Math.round(monthlyTargetAchievement)}%` : 'N/A'}
              </div>
            </div>
            <div className="summary-target-meta mono">
              {monthlyTarget > 0
                ? `${formatRupiah(monthlyRevenue)} / ${formatRupiah(monthlyTarget)}`
                : 'NO TARGET CONFIGURED'}
            </div>
          </div>

          <div className="summary-target-bar" aria-hidden="true">
            <span style={{ width: `${monthlyTarget > 0 ? monthlyTargetAchievement : 0}%` }} />
          </div>

          <div className="summary-target-foot mono">
            {monthlyTarget > 0
              ? `${formatRupiah(monthlyTargetRemaining)} REMAINING • TARGET ACHIEVEMENT PER MONTH`
              : 'TARGET NOT CONFIGURED IN STORE API'}
          </div>
        </div>

        <div className="summary-forecast-card">
          <div className="summary-forecast-head">
            <div>
              <div className="summary-label">FORECAST INCOME</div>
              <div className="summary-forecast-value">{formatRupiah(forecastIncome)}</div>
            </div>
            <div className="summary-forecast-meta mono">
              {monthlyTarget > 0
                ? `${Math.round(forecastVsTarget)}% OF TARGET`
                : 'RUN RATE FORECAST'}
            </div>
          </div>

          <div className="summary-forecast-bar" aria-hidden="true">
            <span style={{ width: `${Math.min(forecastVsTarget, 100)}%` }} />
          </div>

          <div className="summary-forecast-foot mono">
            {monthlyTarget > 0
              ? `PROJECTED MONTH END REVENUE BASED ON CURRENT RUN RATE • ${formatRupiah(monthlyTarget - forecastIncome > 0 ? monthlyTarget - forecastIncome : 0)} TO TARGET`
              : 'PROJECTED MONTH END REVENUE BASED ON CURRENT RUN RATE'}
          </div>
        </div>

        <TransactionPerHourPanel
          dashboard={dashboard}
          branchLocations={branchLocations}
          selectedBranchId={selectedBranchId}
          selectedBranch={derivedSelectedBranch}
          onSelectBranch={onSelectBranch}
          onClearBranch={onClearBranch}
        />

        <div className="summary-quickline mono">
          {dashboard
            ? `MONTH REVENUE ${formatRupiah(dashboard.revenueMonth || 0)} • STAFF ${dashboard.staffOnDuty || 0} • EQUIPMENT ISSUES ${dashboard.equipmentIssues || 0}`
            : 'MONTH REVENUE Rp0 • STAFF 0 • EQUIPMENT ISSUES 0'}
        </div>
      </section>

      <section className="panel summary-right branch-panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">BRANCH LIST</div>
            <div className="panel-subtitle mono">LIVE FROM /STORES/BRANCHES</div>
          </div>
          <div className="panel-meta">{branchLocations.length} LOCATIONS</div>
        </div>

        {branchLocations.length ? (
          <div className="branch-list">
            {branchLocations.map((branch, index) => (
              <BranchCard
                key={branch.id || branch.code || `${branch.name || 'branch'}-${index}`}
                branch={branch}
                index={index}
                selected={String(selectedBranchId ?? derivedSelectedBranch?.storeId ?? derivedSelectedBranch?.id ?? '') === String(getBranchStoreId(branch) ?? '')}
                onClick={() => onSelectBranch(branch)}
              />
            ))}
          </div>
        ) : (
          <div className="branch-empty mono">NO BRANCH LOCATIONS RETURNED FROM THE API.</div>
        )}
      </section>

      <section className="panel summary-footer-panel">
        <div className="panel-head">
          <div className="panel-title">SYSTEM STREAM</div>
          <div className="panel-meta">ATTENDANCE / TIMETABLE</div>
        </div>
        <DailyIncomePreview dashboard={dashboard} />
      </section>
      </div>
      <SummaryMobileView
        dashboard={dashboard}
        selectedBranch={selectedBranch}
        selectedBranchId={selectedBranchId}
        onSelectBranch={onSelectBranch}
        onClearBranch={onClearBranch}
      />
    </>
  );
}

function SummaryMobileView({
  dashboard,
  selectedBranch,
  selectedBranchId,
  onSelectBranch,
  onClearBranch,
}) {
  const branchLocations = dashboard?.branchLocations || [];
  const derivedSelectedBranch = selectedBranch
    || branchLocations.find((branch) => String(getBranchStoreId(branch)) === String(selectedBranchId ?? ''))
    || null;
  const formatCount = (value) => Number(value || 0).toLocaleString('en-US');
  const revenueToday = Number(dashboard?.revenueToday || 0);
  const revenueMonth = Number(dashboard?.revenueMonth || 0);
  const activeServices = Number(dashboard?.activeServices || 0);
  const completedToday = Number(dashboard?.completedToday || 0);
  const staffOnDuty = Number(dashboard?.staffOnDuty || 0);
  const monthVehicleCount = Number(dashboard?.monthVehicleCount || 0);
  const profitMargin = Number(dashboard?.profitMargin || 0);
  const revenueTrend = Number(dashboard?.profitDelta || 0);
  const monthlyTarget = derivedSelectedBranch
    ? parseNumericValue(derivedSelectedBranch.monthlyTarget)
    : branchLocations.reduce((sum, branch) => sum + parseNumericValue(branch.monthlyTarget), 0);
  const monthlyTargetAchievement = monthlyTarget > 0
    ? Math.min((revenueMonth / monthlyTarget) * 100, 100)
    : 0;
  const forecastIncome = revenueMonth > 0
    ? Math.round((revenueMonth / Math.max(new Date().getDate(), 1)) * new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate())
    : 0;
  const systemStatus = Number(dashboard?.equipmentIssues || 0) > 0
    ? 'ATTENTION'
    : dashboard?.confidenceLabel === 'HIGH'
      ? 'OPTIMAL'
      : 'STABLE';
  const efficiencyLift = Number(dashboard?.equipmentIssues || 0) > 0
    ? 0
    : Math.max(8, Math.round(Math.max(profitMargin, revenueTrend, 32) / 4));
  const efficiencyCopy = Number(dashboard?.equipmentIssues || 0) > 0
    ? 'Review open maintenance items before the next peak cycle.'
    : `Efficiency up ${efficiencyLift}% since AI shift.`;
  const insights = Array.isArray(dashboard?.insights) && dashboard.insights.length
    ? dashboard.insights.slice(0, 2)
    : [];
  const branchRows = branchLocations.slice(0, 2);
  const uptimeBars = (dashboard?.throughputBars?.length
    ? dashboard.throughputBars
    : DENSITY_BARS.map((value, index) => ({
        time: DENSITY_LABELS[index]?.label || formatHourLabel(index),
        realTime: value,
      })))
    .slice(0, 12);
  const uptimePercent = Number(dashboard?.equipmentIssues || 0) > 0 ? 98.8 : 99.9;
  const topBranchTrend = [4, 2];
  const scopeLabel = derivedSelectedBranch?.name || dashboard?.scopeLabel || 'COMPANY PREVIEW';

  return (
    <section className="summary-mobile-shell" aria-label="Mobile dashboard summary">
      <div className="summary-mobile-hero">
        <div>
          <div className="summary-mobile-status mono">SYSTEM STATUS: {systemStatus}</div>
          <h1>Executive Overview</h1>
        </div>
        <div className="summary-mobile-scope">
          <div className="summary-mobile-scope-label mono">CURRENT VIEW</div>
          <div className="summary-mobile-scope-value">{scopeLabel}</div>
          {derivedSelectedBranch ? (
            <button type="button" className="summary-mobile-scope-button mono" onClick={onClearBranch}>
              SHOW ALL BRANCHES
            </button>
          ) : (
            <div className="summary-mobile-scope-pill mono">COMPANY PREVIEW</div>
          )}
        </div>
      </div>

      <section className="summary-mobile-card summary-mobile-revenue-card">
        <div className="summary-mobile-card-label mono">TOTAL REVENUE (TODAY)</div>
        <div className="summary-mobile-revenue-row">
          <div className="summary-mobile-revenue-value">{formatRupiah(revenueToday)}</div>
          <div className={`summary-mobile-revenue-change ${revenueTrend >= 0 ? 'up' : 'down'}`}>
            {revenueTrend >= 0 ? '+' : ''}
            {Math.round(revenueTrend)}%
          </div>
        </div>
        <div className="summary-mobile-revenue-copy">
          {dashboard
            ? `MONTH REVENUE ${formatRupiah(revenueMonth)} • ACTIVE ${activeServices} • STAFF ${staffOnDuty}`
            : 'MONTH REVENUE Rp0 • ACTIVE 0 • STAFF 0'}
        </div>
        <div className="summary-mobile-progress" aria-hidden="true">
          <span />
          <span />
          <span />
          <span className="summary-mobile-progress-dim" />
        </div>
      </section>

      <div className="summary-mobile-mini-grid">
        <section className="summary-mobile-card summary-mobile-mini-card">
          <div className="summary-mobile-card-label mono">VEHICLES</div>
          <div className="summary-mobile-mini-value">{formatCount(monthVehicleCount)}</div>
          <div className="summary-mobile-mini-copy mono">THROUGHPUT PEAK</div>
        </section>
        <section className="summary-mobile-card summary-mobile-mini-card summary-mobile-mini-card-accent">
          <div className="summary-mobile-mini-icon">⚡</div>
          <div className="summary-mobile-mini-copy-tight">{efficiencyCopy}</div>
          <div className="summary-mobile-mini-copy mono">COMPLETED {completedToday} TODAY</div>
        </section>
      </div>

      <section className="summary-mobile-card summary-mobile-insights-card">
        <div className="summary-mobile-section-head">
          <div className="summary-mobile-section-title">AI SMART INSIGHTS</div>
          <div className="summary-mobile-section-meta mono">{insights.length ? `${insights.length} LIVE` : 'LIVE'}</div>
        </div>

        <div className="summary-mobile-insight-list">
          {insights.length ? insights.map((item, index) => (
            <article key={`${item.title || 'insight'}-${index}`} className={`summary-mobile-insight ${index === 0 ? 'summary-mobile-insight-primary' : ''}`}>
              <div className="summary-mobile-insight-title">{item.title}</div>
              <p className="summary-mobile-insight-body">{item.body}</p>
              {index === 0 ? (
                <button type="button" className="summary-mobile-insight-link mono" onClick={() => onSelectBranch?.(derivedSelectedBranch || branchLocations[0] || null)}>
                  REVIEW PRICING STRATEGY
                </button>
              ) : null}
            </article>
          )) : (
            <div className="summary-mobile-insight summary-mobile-insight-empty mono">
              NO AI INSIGHTS AVAILABLE RIGHT NOW.
            </div>
          )}
        </div>
      </section>

      <section className="summary-mobile-card summary-mobile-forecast-card">
        <div className="summary-mobile-section-head">
          <div>
            <div className="summary-mobile-section-title">MONTHLY REVENUE FORECAST</div>
            <div className="summary-mobile-forecast-value">{formatRupiah(revenueMonth || 0)}</div>
          </div>
          <div className="summary-mobile-section-meta mono">
            {monthlyTarget > 0 ? `${Math.round(monthlyTargetAchievement)}% GOAL` : 'RUN RATE'}
          </div>
        </div>

        <div className="summary-mobile-forecast-copy">
          {monthlyTarget > 0
            ? `PROJECTED MONTH-END REVENUE BASED ON CURRENT RUN RATE • ${formatRupiah(Math.max(monthlyTarget - forecastIncome, 0))} TO TARGET`
            : 'PROJECTED MONTH-END REVENUE BASED ON CURRENT RUN RATE'}
        </div>

        <div
          className="summary-mobile-ring"
          style={{ '--ring-progress': `${monthlyTarget > 0 ? monthlyTargetAchievement : 72}%` }}
        >
          <div className="summary-mobile-ring-inner">
            <strong>{monthlyTarget > 0 ? `${Math.round(monthlyTargetAchievement)}%` : '72%'}</strong>
            <span className="mono">GOAL</span>
          </div>
        </div>
      </section>

      <section className="summary-mobile-card summary-mobile-branches-card">
        <div className="summary-mobile-section-head">
          <div className="summary-mobile-section-title">TOP PERFORMING BRANCHES</div>
          <div className="summary-mobile-section-action mono">{branchRows.length ? 'VIEW ALL' : 'NONE'}</div>
        </div>

        <div className="summary-mobile-branch-list">
          {branchRows.length ? branchRows.map((branch, index) => {
            const branchName = branch.name || branch.code || branch.location || branch.address || `Branch ${index + 1}`;
            const branchLocation = branch.location || branch.address || branch.raw?.city || branch.raw?.area || 'Branch location unavailable';
            const branchMetric = parseNumericValue(branch.monthlyTarget || branch.monthlyRevenue || branch.revenue || 0);
            const selected = String(selectedBranchId ?? derivedSelectedBranch?.storeId ?? derivedSelectedBranch?.id ?? '') === String(getBranchStoreId(branch) ?? '');

            return (
              <button
                key={branch.id || branch.code || `${branchName}-${index}`}
                type="button"
                className={`summary-mobile-branch ${selected ? 'selected' : ''}`}
                onClick={() => onSelectBranch(branch)}
              >
                <div className="summary-mobile-branch-rank">#{String(index + 1).padStart(2, '0')}</div>
                <div className="summary-mobile-branch-copy">
                  <strong>{branchName}</strong>
                  <span className="mono">{branchLocation}</span>
                </div>
                <div className="summary-mobile-branch-meta">
                  <strong>{formatRupiah(branchMetric)}</strong>
                  <span className={`mono summary-mobile-branch-trend summary-mobile-branch-trend-${index === 0 ? 'up' : 'flat'}`}>
                    {topBranchTrend[index] ? `↑ ${topBranchTrend[index]}%` : '↑ 0%'}
                  </span>
                </div>
              </button>
            );
          }) : (
            <div className="summary-mobile-empty mono">NO BRANCH DATA AVAILABLE.</div>
          )}
        </div>
      </section>

      <section className="summary-mobile-card summary-mobile-uptime-card">
        <div className="summary-mobile-section-head">
          <div className="summary-mobile-section-title">OPERATIONAL UPTIME</div>
          <div className="summary-mobile-uptime-status mono">
            <span className="summary-mobile-uptime-dot" />
            {uptimePercent.toFixed(1)}%
          </div>
        </div>

        <div className="summary-mobile-uptime-bars" aria-hidden="true">
          {uptimeBars.map((bar, index) => {
            const height = Math.max(
              24,
              Math.min(100, Math.round((Number(bar.realTime ?? bar.count ?? bar.value ?? bar) / Math.max(DENSITY_BARS[4], 1)) * 100))
            );

            return (
              <span key={`${bar.time || 'bar'}-${index}`} style={{ height: `${height}%` }} />
            );
          })}
        </div>
      </section>
    </section>
  );
}

const INVENTORY_CATEGORY_PRIORITY = {
  chemical: 0,
  hardware: 1,
  supply: 2,
  tool: 3,
  consumable: 4,
  other: 5,
};

const formatInventoryDate = (value) => {
  if (!value) {
    return '—';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value).toUpperCase();
  }

  return parsed.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).toUpperCase();
};

const formatInventoryNumber = (value) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed.toLocaleString('en-US') : '0';
};

const getInventoryStockRank = (item) => {
  const rankByStatus = {
    'out-of-stock': 0,
    'low-stock': 1,
    'in-stock': 2,
    discontinued: 3,
    inactive: 4,
  };

  return rankByStatus[String(item?.stockStatus || '').toLowerCase()] ?? 5;
};

const compareInventoryItems = (left, right) => (
  (INVENTORY_CATEGORY_PRIORITY[String(left?.category || 'other').toLowerCase()] ?? 99)
  - (INVENTORY_CATEGORY_PRIORITY[String(right?.category || 'other').toLowerCase()] ?? 99)
  || getInventoryStockRank(left) - getInventoryStockRank(right)
  || (Number(left?.quantity || 0) - Number(right?.quantity || 0))
  || String(left?.itemName || '').localeCompare(String(right?.itemName || ''))
);

const getInventoryPercent = (item) => {
  const quantity = Number(item?.quantity || 0);
  const maxQuantity = Number(item?.maxQuantity || 0);
  const reorderPoint = Number(item?.reorderPoint || 0);

  if (maxQuantity > 0) {
    return Math.max(0, Math.min(100, Math.round((quantity / maxQuantity) * 100)));
  }

  if (reorderPoint > 0) {
    return Math.max(0, Math.min(100, Math.round((quantity / reorderPoint) * 100)));
  }

  return quantity > 0 ? Math.min(100, quantity) : 0;
};

const getInventoryTone = (item) => {
  if (item?.tone) {
    return item.tone;
  }

  if (item?.stockStatus === 'out-of-stock') {
    return 'bad';
  }

  if (item?.stockStatus === 'low-stock') {
    return 'warn';
  }

  return item?.categoryTone || 'good';
};

const getInventoryIcon = (category) => {
  switch (String(category || 'other').toLowerCase()) {
    case 'chemical':
      return '◌';
    case 'hardware':
      return '▥';
    case 'tool':
      return '⟳';
    case 'consumable':
      return '✦';
    case 'supply':
      return '▣';
    default:
      return '◆';
  }
};

const getInventoryLevelLabel = (item, index) => (
  item?.itemCode
  || item?.subCategory
  || `LVL_${String(index + 1).padStart(2, '0')}`
).toString().toUpperCase();

const getInventoryStatusLabel = (item) => {
  const status = String(item?.stockStatus || item?.status || 'in-stock').toLowerCase();

  if (status === 'out-of-stock') {
    return 'OUT OF STOCK';
  }

  if (status === 'low-stock') {
    return 'REPLENISHMENT_REQUIRED';
  }

  if (status === 'discontinued') {
    return 'DISCONTINUED';
  }

  return item?.category === 'hardware' ? 'STATUS: NOMINAL' : 'STATUS: STABLE';
};

const getInventoryHardwareDetail = (item) => {
  if (item?.supplier) {
    return `SUPPLIER: ${String(item.supplier).toUpperCase()}`;
  }

  if (item?.notes) {
    return String(item.notes).toUpperCase();
  }

  if (item?.reorderPoint !== null && item?.reorderPoint !== undefined) {
    return `REORDER_POINT: ${formatInventoryNumber(item.reorderPoint)}`;
  }

  return 'NO ADDITIONAL NOTES';
};

const normalizeInventorySearch = (item) => [
  item?.itemCode,
  item?.itemName,
  item?.category,
  item?.subCategory,
  item?.supplier,
  item?.status,
  item?.stockStatus,
  item?.unit,
  item?.quantity,
  item?.branchId,
  typeof item?.location === 'string' ? item.location : JSON.stringify(item?.location || {}),
]
  .join(' ')
  .toLowerCase();

function InventoryView({ dashboard }) {
  const scopeLabel = dashboard?.scopeLabel || 'COMPANY PREVIEW';
  const branchCount = Array.isArray(dashboard?.branchLocations) ? dashboard.branchLocations.length : 0;
  const issueCount = Number(dashboard?.equipmentIssues || 0);
  const [inventoryQuery, setInventoryQuery] = useState('');
  const [inventoryState, setInventoryState] = useState({
    items: [],
    summary: {},
    lowStock: [],
    loading: true,
    error: '',
  });
  const normalizedQuery = inventoryQuery.trim().toLowerCase();

  useEffect(() => {
    let cancelled = false;

    const loadInventory = async () => {
      setInventoryState((current) => ({
        ...current,
        loading: true,
        error: '',
      }));

      try {
        const result = await loadInventoryCatalog();

        if (cancelled) {
          return;
        }

        setInventoryState({
          items: Array.isArray(result?.items) ? result.items : [],
          summary: result?.summary || {},
          lowStock: Array.isArray(result?.lowStock) ? result.lowStock : [],
          loading: false,
          error: '',
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setInventoryState({
          items: [],
          summary: {},
          lowStock: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load inventory data',
        });
      }
    };

    loadInventory();

    return () => {
      cancelled = true;
    };
  }, []);

  const inventoryItems = inventoryState.items || [];
  const inventorySummary = inventoryState.summary || {};
  const searchMatches = useMemo(() => (
    normalizedQuery
      ? inventoryItems.filter((item) => normalizeInventorySearch(item).includes(normalizedQuery))
      : inventoryItems
  ), [inventoryItems, normalizedQuery]);

  const filteredChemicals = useMemo(() => (
    searchMatches
      .filter((item) => String(item?.category || '').toLowerCase() === 'chemical')
      .sort(compareInventoryItems)
      .slice(0, 3)
      .map((item, index) => ({
        key: item.id || item.itemCode || `${item.itemName || 'chemical'}-${index}`,
        level: getInventoryLevelLabel(item, index),
        name: String(item.itemName || 'UNKNOWN_ITEM').toUpperCase(),
        percent: getInventoryPercent(item),
        status: getInventoryStatusLabel(item),
        tone: getInventoryTone(item),
        icon: getInventoryIcon(item.category),
      }))
  ), [searchMatches]);

  const filteredHardware = useMemo(() => (
    searchMatches
      .filter((item) => ['hardware', 'tool'].includes(String(item?.category || '').toLowerCase()))
      .sort(compareInventoryItems)
      .slice(0, 4)
      .map((item, index) => ({
        key: item.id || item.itemCode || `${item.itemName || 'hardware'}-${index}`,
        name: String(item.itemName || 'UNKNOWN_ITEM').toUpperCase(),
        badge: `STOCK ${formatInventoryNumber(item.quantity)} ${String(item.unit || '').toUpperCase()}`.trim(),
        icon: getInventoryIcon(item.category),
        lastService: formatInventoryDate(item.lastRestockedAt),
        detail: getInventoryHardwareDetail(item),
        tone: getInventoryTone(item),
      }))
  ), [searchMatches]);

  const filteredSupplies = useMemo(() => (
    searchMatches
      .filter((item) => !['chemical', 'hardware', 'tool'].includes(String(item?.category || '').toLowerCase()))
      .sort(compareInventoryItems)
      .slice(0, 6)
      .map((item, index) => ({
        key: item.id || item.itemCode || `${item.itemName || 'supply'}-${index}`,
        id: String(item.itemCode || item.itemName || 'UNKNOWN_ITEM').toUpperCase(),
        qty: Number(item.quantity || 0),
        tone: getInventoryTone(item),
      }))
  ), [searchMatches]);

  const inventorySummaryLine = [
    `BRANCHES ${branchCount}`,
    `SCOPE ${scopeLabel}`,
    `ISSUES ${issueCount}`,
    `ITEMS ${formatInventoryNumber(inventorySummary.totalItems ?? inventoryItems.length)}`,
    `LOW STOCK ${formatInventoryNumber(inventorySummary.lowStock ?? inventoryState.lowStock.length)}`,
    `OUT OF STOCK ${formatInventoryNumber(inventorySummary.outOfStock || 0)}`,
    `VALUE ${formatRupiah(inventorySummary.totalValue || 0)}`,
  ];

  return (
    <div className="route-grid route-grid-inventory">
      <section className="panel inventory-panel inventory-main-panel">
        <div className="inventory-hero">
          <div className="inventory-hero-copy">
            <div className="panel-title inventory-panel-title">INVENTORY_LOG</div>
            <div className="panel-subtitle mono">CHEMICAL_ANALYSIS • HARDWARE_STATUS • GLOBAL_CONTROL</div>
          </div>

          <div className="inventory-hero-tools">
            <label className="inventory-query mono">
              <span>QUERY_SYSTEM ...</span>
              <input
                type="search"
                value={inventoryQuery}
                onChange={(event) => setInventoryQuery(event.target.value)}
                placeholder="Search inventory..."
              />
            </label>
            <div className="inventory-telemetry-pill mono">LIVE_TELEMETRY</div>
          </div>
        </div>

        <div className="inventory-hero-meta mono">
          {inventorySummaryLine.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>

        {inventoryState.loading ? <div className="inventory-empty mono">LOADING INVENTORY FROM BACKEND...</div> : null}
        {inventoryState.error ? <div className="inventory-empty mono">INVENTORY API ERROR: {inventoryState.error}</div> : null}

        <section className="inventory-section">
          <div className="inventory-section-head">
            <div className="inventory-section-title">CHEMICAL_ANALYSIS</div>
            <div className="inventory-section-badge mono">{formatInventoryNumber(filteredChemicals.length)} ITEMS</div>
          </div>

          <div className="inventory-chemical-grid">
            {filteredChemicals.length ? (
              filteredChemicals.map((item) => (
                <article key={item.key} className={`inventory-chemical-card inventory-chemical-card-${item.tone}`}>
                  <div className="inventory-chemical-head">
                    <div className="inventory-chemical-level mono">{item.level}</div>
                    <div className="inventory-chemical-icon" aria-hidden="true">{item.icon}</div>
                  </div>
                  <div className="inventory-chemical-name mono">{item.name}</div>
                  <div className="inventory-chemical-percent">
                    <strong>{item.percent}</strong>
                    <span>%</span>
                  </div>
                  <div className="inventory-progress" aria-hidden="true">
                    {Array.from({ length: 10 }).map((_, index) => (
                      <span
                        key={`${item.level}-bar-${index}`}
                        className={index < Math.round(item.percent / 10) ? 'inventory-progress-active' : ''}
                      />
                    ))}
                  </div>
                  <div className="inventory-chemical-status mono">{item.status}</div>
                </article>
              ))
            ) : (
              <div className="inventory-empty mono">NO CHEMICALS MATCH THIS QUERY.</div>
            )}
          </div>
        </section>

        <section className="inventory-section">
          <div className="inventory-section-head">
            <div className="inventory-section-title">HARDWARE_STATUS</div>
            <div className="inventory-section-badge mono">{formatInventoryNumber(filteredHardware.length)} ITEMS</div>
          </div>

          <div className="inventory-hardware-grid">
            {filteredHardware.length ? (
              filteredHardware.map((item) => (
                <article key={item.key} className={`inventory-hardware-card inventory-hardware-card-${item.tone}`}>
                  <div className="inventory-hardware-icon">
                    <span>{item.icon}</span>
                  </div>
                  <div className="inventory-hardware-body">
                    <div className="inventory-hardware-head">
                      <div className="inventory-hardware-name">{item.name}</div>
                      <div className="inventory-hardware-badge mono">{item.badge}</div>
                    </div>
                    <div className="inventory-hardware-meta mono">LAST_SERVICE: {item.lastService}</div>
                    <div className="inventory-hardware-detail mono">{item.detail}</div>
                  </div>
                </article>
              ))
            ) : (
              <div className="inventory-empty mono">NO HARDWARE MATCHES THIS QUERY.</div>
            )}
          </div>
        </section>
      </section>

      <aside className="panel inventory-side-panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">SUPPLIES_LOG</div>
            <div className="panel-subtitle mono">ITEM_ID / QTY SNAPSHOT</div>
          </div>
          <div className="panel-meta">{formatInventoryNumber(filteredSupplies.length)} ITEMS</div>
        </div>

        <div className="inventory-supplies-table">
          <div className="inventory-supplies-head mono">
            <span>ITEM_ID</span>
            <span>QTY</span>
          </div>
          {filteredSupplies.length ? (
            filteredSupplies.map((item) => (
              <div key={item.key} className={`inventory-supplies-row inventory-supplies-row-${item.tone}`}>
                <span className="inventory-supplies-item mono">{item.id}</span>
                <span className="inventory-supplies-qty mono">{formatInventoryNumber(item.qty)}</span>
              </div>
            ))
          ) : (
            <div className="inventory-empty mono">NO SUPPLIES MATCH THIS QUERY.</div>
          )}
        </div>

        <div className="inventory-action-center">
          <div className="inventory-action-head mono">GLOBAL_ACTION_CENTER</div>
          <button type="button" className="inventory-action-primary">
            <span className="inventory-action-icon" aria-hidden="true">🛒</span>
            BULK_RESTOCK_PROTOCOL
          </button>
          <button type="button" className="inventory-action-secondary">
            <span className="inventory-action-icon" aria-hidden="true">▣</span>
            EXPORT_INV_REPORT
          </button>
        </div>
      </aside>
    </div>
  );
}

function MembersView({ dashboard }) {
  const navigate = useNavigate();
  const { memberId } = useParams();
  const [memberQuery, setMemberQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const normalizedQuery = memberQuery.trim().toLowerCase();
  const isDetailView = Boolean(memberId);
  const selectedMember = useMemo(
    () => MEMBER_DIRECTORY.find((member) => String(member.id) === String(memberId ?? '')) || MEMBER_DIRECTORY[0],
    [memberId]
  );

  const filteredMembers = useMemo(() => {
    return MEMBER_DIRECTORY.filter((member) => {
      if (tierFilter !== 'all' && String(member.tier).toLowerCase() !== tierFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [
        member.id,
        member.name,
        member.tier,
        member.plate,
        member.vehicle,
        member.color,
        member.status,
        member.phone,
        member.email,
        member.bay,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [normalizedQuery, tierFilter]);

  const visibleMembers = filteredMembers.slice(0, 4);
  const membersStats = [
    {
      label: 'TOTAL MEMBERS',
      value: String(MEMBER_DIRECTORY_TOTAL).replace(/\B(?=(\d{3})+(?!\d))/g, ','),
      subtext: '+12% VS LAST MONTH',
      bar: 74,
      tone: 'sand',
    },
    {
      label: 'ELITE TIER RATIO',
      value: '42%',
      subtext: 'HIGH PERFORMANCE',
      bar: 42,
      tone: 'blue',
    },
    {
      label: 'AVG. MONTHLY WASHES',
      value: '3.8',
      subtext: 'PER ACTIVE MEMBER',
      bar: 61,
      tone: 'green',
    },
    {
      label: 'EXPIRING SOON',
      value: '24',
      subtext: 'REQUIRES ACTION',
      bar: 24,
      tone: 'bad',
    },
  ];
  const visibleSummary = normalizedQuery || tierFilter !== 'all'
    ? `${visibleMembers.length} MATCHES OF ${filteredMembers.length} FILTERED MEMBERS`
    : `1-${Math.min(visibleMembers.length, 4)} OF ${MEMBER_DIRECTORY_TOTAL} MEMBERS`;
  const lastUpdated = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const handleOpenMember = (member) => {
    navigate(`/members/${member.id}`);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key !== 'Enter') {
      return;
    }

    if (!normalizedQuery) {
      return;
    }

    const match = MEMBER_DIRECTORY.find((member) => (
      String(member.id).includes(normalizedQuery)
      || String(member.name).toLowerCase().includes(normalizedQuery)
      || String(member.plate).toLowerCase().includes(normalizedQuery)
    ));

    if (match) {
      navigate(`/members/${match.id}`);
    }
  };

  if (isDetailView) {
    const totalLogCost = selectedMember.recentVisits.reduce((sum, visit) => sum + Number(visit.cost || 0), 0);

    return (
      <div className="route-grid route-grid-members members-view members-view-detail">
        <section className="panel members-detail-panel">
          <div className="members-detail-hero">
            <div className="members-detail-hero-copy">
              <div className="panel-title members-panel-title">MEMBER_DETAILS</div>
              <div className="members-detail-badge mono">ID: #{selectedMember.id}-X</div>
            </div>
            <div className="members-detail-hero-tools">
              <label className="member-search mono">
                <span>SEARCH GLOBAL DB...</span>
                <input
                  type="search"
                  value={memberQuery}
                  onChange={(event) => setMemberQuery(event.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search Global DB..."
                />
              </label>
              <button type="button" className="members-back-btn" onClick={() => navigate('/members')}>
                SHOW DIRECTORY
              </button>
            </div>
          </div>

          <div className="members-detail-grid">
            <section className="panel members-profile-panel">
              <div className="member-profile-portrait">
                <div className="member-avatar member-avatar-large">{getMemberInitials(selectedMember)}</div>
              </div>
              <div className="member-profile-name">{selectedMember.name}</div>
              <div className="member-profile-tier mono">{selectedMember.tier} MEMBER</div>

              <div className="member-profile-divider" />

              <div className="member-profile-meta">
                <div className="member-profile-meta-label mono">MEMBER SINCE</div>
                <div className="member-profile-meta-value">{formatMemberDate(selectedMember.memberSince)}</div>
              </div>

              <div className="member-profile-meta">
                <div className="member-profile-meta-label mono">CONTACT</div>
                <div className="member-profile-meta-value">{selectedMember.phone}</div>
                <div className="member-profile-meta-sub">{selectedMember.email}</div>
              </div>

              <div className="member-qr-card">
                <div className="member-qr-code" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <div className="member-qr-caption mono">SCAN FOR FAST-TRACK</div>
              </div>

              <div className="member-profile-actions">
                <button type="button" className="member-action-primary">ISSUE PASS</button>
                <button type="button" className="member-action-secondary">EDIT INFO</button>
              </div>
            </section>

            <section className="member-activity-column">
              <article className="panel member-vehicle-panel">
                <div className="panel-head">
                  <div>
                    <div className="panel-title">PRIMARY VEHICLE</div>
                    <div className="panel-subtitle mono">PRIMARY VEHICLE PROFILE</div>
                  </div>
                  <div className="member-vehicle-icon" aria-hidden="true">▣</div>
                </div>

                <div className="member-vehicle-grid">
                  <div>
                    <div className="member-vehicle-name">{selectedMember.vehicle}</div>
                    <div className="member-vehicle-plate mono">PLATE: {selectedMember.plate}</div>
                  </div>
                  <div className="member-vehicle-color">
                    <span className="mono">COLOR</span>
                    <strong>{selectedMember.color}</strong>
                  </div>
                </div>
              </article>

              <article className="panel member-log-panel">
                <div className="panel-head">
                  <div>
                    <div className="panel-title">WASH LOG RECENT</div>
                    <div className="panel-subtitle mono">LATEST VISIT HISTORY</div>
                  </div>
                  <div className="member-log-meta mono">{selectedMember.recentVisits.length} RECORDS</div>
                </div>

                <div className="member-log-table">
                  <div className="member-log-head mono">
                    <span>DATE</span>
                    <span>PACKAGE</span>
                    <span>RESULT</span>
                    <span>COST</span>
                  </div>

                  {selectedMember.recentVisits.map((visit) => (
                    <div key={`${selectedMember.id}-${visit.date}-${visit.package}`} className="member-log-row">
                      <span className="member-log-date mono">{formatMemberDateTime(visit.date)}</span>
                      <span className="member-log-package mono">{visit.package}</span>
                      <span className="member-log-result mono">{visit.result}</span>
                      <span className="member-log-cost mono">
                        {visit.cost > 0 ? formatRupiah(visit.cost) : 'Rp0 (SUB)'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="member-log-footer mono">
                  DOWNLOAD COMPLETE LOG (CSV) • TOTAL VALUE {formatRupiah(totalLogCost)}
                </div>
              </article>
            </section>

            <aside className="member-detail-stack">
              <section className="panel member-status-panel">
                <div className="panel-head">
                  <div className="panel-title">MEMBERSHIP STATUS</div>
                  <div className={`member-status-pill member-status-pill-${getMemberStatusTone(selectedMember.status)}`}>{selectedMember.status}</div>
                </div>

                <div className="member-status-tier">{selectedMember.tier}</div>
                <div className="member-status-subtitle">{selectedMember.tier === 'ELITE' ? 'Annual Executive Tier' : selectedMember.tier === 'PRO' ? 'Monthly Pro Tier' : 'Basic Access Tier'}</div>

                <div className="member-status-box mono">
                  <div className="member-status-box-row">
                    <span>Next Billing</span>
                    <strong>{formatMemberDate(selectedMember.nextBilling)}</strong>
                  </div>
                  <div className="member-status-box-row">
                    <span>Amount Due</span>
                    <strong>{selectedMember.amountDue > 0 ? formatRupiah(selectedMember.amountDue) : 'PAID'}</strong>
                  </div>
                </div>

                <button type="button" className="member-subscription-btn">MANAGE SUBSCRIPTION</button>
              </section>

              <section className="panel member-loyalty-panel">
                <div className="panel-head">
                  <div className="panel-title">LOYALTY PROGRAM</div>
                  <div className="panel-meta mono">AVAILABLE POINTS</div>
                </div>

                <div className="member-points">{selectedMember.points.toLocaleString('en-US')}</div>
                <div className="member-progress" aria-hidden="true">
                  {Array.from({ length: 10 }).map((_, index) => (
                    <span
                      key={`${selectedMember.id}-point-${index}`}
                      className={index < Math.round(selectedMember.loyaltyProgress / 10) ? 'member-progress-active' : ''}
                    />
                  ))}
                </div>
                <div className="member-progress-copy mono">180 POINTS TO NEXT TIER REWARD</div>
              </section>

              <section className="panel member-alert-panel">
                <div className="member-alert-head">
                  <div className="member-alert-icon">!</div>
                  <div className="member-alert-title">SYSTEM ALERT</div>
                </div>
                <p className="member-alert-copy">
                  {selectedMember.statusTone === 'expired'
                    ? 'This membership is expired. A renewal prompt should be sent before the next wash visit.'
                    : `Card on file for ${selectedMember.name} expires in 14 days. Immediate update required to avoid service interruption.`}
                </p>
              </section>
            </aside>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="route-grid route-grid-members members-view members-view-directory">
      <section className="panel members-directory-panel">
        <div className="members-directory-hero">
          <div className="members-directory-copy">
            <div className="panel-title members-panel-title">MEMBER DIRECTORY</div>
            <div className="panel-subtitle mono">CUSTOMER CRM / LOYALTY / VISIT HISTORY</div>
          </div>

          <div className="members-directory-tools">
            <label className="member-search mono">
              <span>SEARCH MEMBERS...</span>
              <input
                type="search"
                value={memberQuery}
                onChange={(event) => setMemberQuery(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search members..."
              />
            </label>

            <button type="button" className="members-add-btn">
              <span>+</span>
              <strong>ADD NEW MEMBER</strong>
            </button>
          </div>
        </div>

        <div className="members-filter-row">
          <div className="members-tier-tabs">
            {[
              { key: 'all', label: 'ALL' },
              { key: 'elite', label: 'ELITE' },
              { key: 'pro', label: 'PRO' },
              { key: 'basic', label: 'BASIC' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                className={`member-tier-tab ${tierFilter === item.key ? 'member-tier-tab-active' : ''}`}
                onClick={() => setTierFilter(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button type="button" className="members-advanced-btn">
            ADVANCED FILTERS
          </button>

          <div className="members-updated mono">LAST UPDATED: {lastUpdated}</div>
        </div>

        <div className="members-table-shell">
          <div className="members-table-head mono">
            <span>MEMBER IDENTIFICATION</span>
            <span>MEMBERSHIP TIER</span>
            <span>PLATE ID</span>
            <span>LAST VISIT</span>
            <span>STATUS</span>
            <span />
          </div>

          <div className="members-table">
            {visibleMembers.length ? (
              visibleMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  className="members-table-row"
                  onClick={() => handleOpenMember(member)}
                >
                  <div className="members-table-member">
                    <div className={`member-avatar member-avatar-${getMemberTierTone(member.tier)}`}>{getMemberInitials(member)}</div>
                    <div className="members-table-member-copy">
                      <div className="members-table-name">{member.name}</div>
                      <div className="members-table-id mono">MEMBER ID: #{member.id}</div>
                    </div>
                  </div>

                  <div>
                    <span className={`member-tier-pill member-tier-pill-${getMemberTierTone(member.tier)}`}>{member.tier}</span>
                  </div>

                  <div className="members-table-plate mono">{member.plate}</div>

                  <div className="members-table-visit mono">
                    <strong>{formatMemberDate(member.lastVisit)}</strong>
                    <span>{formatMemberDateTime(member.lastVisit).split(' ').slice(1).join(' ')} • {member.bay}</span>
                  </div>

                  <div>
                    <span className={`member-status-pill member-status-pill-${getMemberStatusTone(member.status)}`}>{member.status}</span>
                  </div>

                  <div className="members-table-menu mono">⋮</div>
                </button>
              ))
            ) : (
              <div className="members-empty mono">NO MEMBERS MATCH THIS FILTER.</div>
            )}
          </div>

          <div className="members-table-foot">
            <div className="members-table-foot-copy mono">SHOWING {visibleSummary}</div>
            <div className="members-pagination mono">
              <button type="button" disabled aria-label="Previous page">‹</button>
              <span className="members-pagination-active">1</span>
              <span>2</span>
              <span>3</span>
              <span>…</span>
              <button type="button" disabled aria-label="Next page">›</button>
            </div>
          </div>
        </div>
      </section>

      <div className="stats-row members-stats-row">
        {membersStats.map((item) => (
          <StatCard key={item.label} item={item} />
        ))}
      </div>
    </div>
  );
}

function BarcodeSvg({ value, className = '', height = 110 }) {
  const barcodeRef = useRef(null);
  const barcodeValue = useMemo(() => sanitizeCode39Value(value), [value]);

  useEffect(() => {
    if (!barcodeRef.current || !barcodeValue) {
      return;
    }

    try {
      JsBarcode(barcodeRef.current, barcodeValue, {
        format: 'CODE39',
        width: 2,
        height,
        margin: 0,
        displayValue: false,
        lineColor: '#07111f',
        background: '#ffffff',
      });
    } catch (error) {
      console.error('Failed to render compliment barcode:', error);
    }
  }, [barcodeValue, height]);

  return <svg ref={barcodeRef} className={className} role="img" aria-label={`Barcode for ${barcodeValue}`} />;
}

function ComplimentsView({ dashboard }) {
  const scopeLabel = dashboard?.scopeLabel || 'COMPANY PREVIEW';
  const [compliments, setCompliments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [selectedComplimentId, setSelectedComplimentId] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [copyFeedback, setCopyFeedback] = useState('');
  const [creatingVoucher, setCreatingVoucher] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadCompliments = async () => {
      setLoading(true);
      setError('');

      try {
        const result = await fetchCompliments({
          search,
          status: statusFilter,
          limit: 24,
        });

        if (!isActive) {
          return;
        }

        const list = Array.isArray(result?.compliments) ? result.compliments : [];
        setCompliments(list);
        setSummary(result?.summary || null);

        setSelectedComplimentId((current) => {
          if (current && list.some((item) => String(item.complimentId ?? item.id) === String(current))) {
            return current;
          }

          return list[0]?.complimentId ?? list[0]?.id ?? null;
        });
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : 'Failed to load compliment passes');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadCompliments();

    return () => {
      isActive = false;
    };
  }, [refreshTick, search, statusFilter]);

  const selectedCompliment = useMemo(
    () => compliments.find((item) => String(item.complimentId ?? item.id) === String(selectedComplimentId ?? '')) || compliments[0] || null,
    [compliments, selectedComplimentId]
  );

  const stats = [
    {
      label: 'READY TO SCAN',
      value: String(summary?.active ?? 0),
      subtext: 'VOUCHERS READY TO REDEEM',
      bar: Math.min(Number(summary?.active ?? 0) * 8, 100),
      tone: 'green',
    },
    {
      label: 'INACTIVE',
      value: String(summary?.inactive ?? 0),
      subtext: 'PAUSED OR EXPIRED',
      bar: Math.min(Number(summary?.inactive ?? 0) * 8, 100),
      tone: 'bad',
    },
    {
      label: 'EXPIRING SOON',
      value: String(compliments.filter((item) => {
        const expiresAt = item?.expiresAt ? new Date(item.expiresAt) : null;
        if (!expiresAt || Number.isNaN(expiresAt.getTime())) {
          return false;
        }

        const daysRemaining = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return daysRemaining <= 7 && daysRemaining >= 0;
      }).length),
      subtext: 'REVIEW THESE COUPONS',
      bar: Math.min(
        compliments.filter((item) => {
          const expiresAt = item?.expiresAt ? new Date(item.expiresAt) : null;
          if (!expiresAt || Number.isNaN(expiresAt.getTime())) {
            return false;
          }

          const daysRemaining = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
          return daysRemaining <= 7 && daysRemaining >= 0;
        }).length * 20,
        100
      ),
      tone: 'sand',
    },
    {
      label: 'TOTAL COUPON',
      value: String(summary?.total ?? compliments.length ?? 0),
      subtext: 'LOADED FROM tbl_coupon',
      bar: Math.min(Number(summary?.total ?? compliments.length ?? 0) * 6, 100),
      tone: 'sand',
    },
  ];
  const expiringSoonCount = compliments.filter((item) => {
    const expiresAt = item?.expiresAt ? new Date(item.expiresAt) : null;
    if (!expiresAt || Number.isNaN(expiresAt.getTime())) {
      return false;
    }

    const daysRemaining = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysRemaining <= 7 && daysRemaining >= 0;
  }).length;

  stats[2] = {
    label: 'EXPIRING SOON',
    value: String(expiringSoonCount),
    subtext: 'REVIEW THESE COUPONS',
    bar: Math.min(expiringSoonCount * 20, 100),
    tone: 'sand',
  };

  const statusChips = [
    { label: 'ACTIVE', value: 'active' },
    { label: 'ALL', value: 'all' },
    { label: 'INACTIVE', value: 'inactive' },
  ];

  const handleCopyCode = async () => {
    const code = selectedCompliment?.barcodeValue || selectedCompliment?.complimentCode;
    if (!code || typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setCopyFeedback('CODE COPIED');
      window.setTimeout(() => setCopyFeedback(''), 2000);
    } catch (copyError) {
      console.error('Failed to copy compliment code:', copyError);
    }
  };

  const handleGenerateVoucher = async () => {
    if (creatingVoucher) {
      return;
    }

    setCreatingVoucher(true);
    setError('');

    try {
      const result = await createComplimentVoucher();
      const created = result?.compliment || null;
      setRefreshTick((tick) => tick + 1);

      if (created?.complimentId || created?.id || created?.couponCode) {
        const nextId = String(created.complimentId ?? created.id ?? created.couponCode);
        setSelectedComplimentId(nextId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create compliment voucher');
    } finally {
      setCreatingVoucher(false);
    }
  };

  return (
    <div className="route-grid route-grid-compliments compliments-view">
      <section className="panel compliments-hero-panel">
        <div className="compliments-hero">
          <div>
            <div className="panel-title compliments-panel-title">COMPLIMENTS</div>
            <div className="panel-subtitle mono">BARCODE PASSES GENERATED FROM THE BACKEND API</div>
          </div>

          <div className="compliments-hero-copy mono">
            <span>{scopeLabel}</span>
            <span>{loading ? 'LOADING PASS LIST...' : `${compliments.length} PASS${compliments.length === 1 ? '' : 'ES'} READY`}</span>
          </div>
        </div>

        <div className="compliments-controls">
          <label className="member-search mono compliments-search">
            <span>SEARCH PASS...</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search compliment pass..."
            />
          </label>

          <div className="compliments-filter-bar">
            {statusChips.map((chip) => (
              <button
                key={chip.value}
                type="button"
                className={`attendance-filter-chip ${statusFilter === chip.value ? 'attendance-filter-chip-active' : ''}`}
                onClick={() => setStatusFilter(chip.value)}
              >
                <span>{chip.label}</span>
              </button>
            ))}
            <button
              type="button"
              className="primary-btn compliments-generate-btn"
              onClick={handleGenerateVoucher}
              disabled={creatingVoucher}
            >
              {creatingVoucher ? 'CREATING...' : 'NEW VOUCHER'}
            </button>
            <button type="button" className="ghost-btn compliments-refresh-btn" onClick={() => setRefreshTick((tick) => tick + 1)}>
              REFRESH API
            </button>
          </div>
        </div>

        {error ? <div className="error-banner">{error}</div> : null}

        <div className="stats-row compliments-stats-row">
          {stats.map((item) => (
            <StatCard key={item.label} item={item} />
          ))}
        </div>
      </section>

      <section className="panel compliments-focus-panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">SELECTED PASS</div>
            <div className="panel-subtitle mono">SCAN THE BARCODE TO REDEEM THE COMPLIMENT</div>
          </div>
          <div className={`member-status-pill member-status-pill-${getComplimentStatusTone(selectedCompliment?.status)}`}>
            {selectedCompliment?.status || 'NO PASS'}
          </div>
        </div>

        {selectedCompliment ? (
          <>
            <div className="compliment-hero-card">
              <div className="compliment-hero-copy-block">
                <div className="compliment-name">{selectedCompliment.name || selectedCompliment.couponCode}</div>
                <div className="compliment-meta mono">
                  CODE {selectedCompliment.couponCode} • {selectedCompliment.status}
                </div>
                <div className="compliment-code mono">{selectedCompliment.couponCode}</div>
                <div className="compliment-reward">{selectedCompliment.rewardText}</div>
                <div className="compliment-scan-hint mono">{selectedCompliment.scanHint}</div>
              </div>

              <div className="compliment-barcode-card">
                <BarcodeSvg value={selectedCompliment.barcodeValue} className="compliment-barcode" height={126} />
                <div className="compliment-barcode-caption mono">{selectedCompliment.barcodeValue}</div>
              </div>
            </div>

            <div className="compliment-detail-grid">
              <div className="compliment-detail-chip">
                <span className="mono">COUPON CODE</span>
                <strong>{selectedCompliment.couponCode}</strong>
              </div>
              <div className="compliment-detail-chip">
                <span className="mono">DISCOUNT</span>
                <strong>
                  {selectedCompliment.discountValue !== null && typeof selectedCompliment.discountValue !== 'undefined'
                    ? `${selectedCompliment.discountValue}${selectedCompliment.discountType ? ` ${selectedCompliment.discountType}` : ''}`
                    : 'N/A'}
                </strong>
              </div>
              <div className="compliment-detail-chip">
                <span className="mono">ISSUED</span>
                <strong>{formatMemberDate(selectedCompliment.issuedAt)}</strong>
              </div>
              <div className="compliment-detail-chip">
                <span className="mono">EXPIRES</span>
                <strong>{formatMemberDate(selectedCompliment.expiresAt)}</strong>
              </div>
            </div>

            <div className="compliment-actions">
              <button type="button" className="primary-btn" onClick={handleCopyCode}>
                COPY CODE
              </button>
              <button type="button" className="ghost-btn" onClick={() => setRefreshTick((tick) => tick + 1)}>
                RELOAD API
              </button>
            </div>

            {copyFeedback ? <div className="compliment-copy-feedback mono">{copyFeedback}</div> : null}
          </>
        ) : (
          <div className="compliment-empty mono">NO COMPLIMENT PASS AVAILABLE</div>
        )}
      </section>

      <section className="panel compliments-list-panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">PASS LIST</div>
              <div className="panel-subtitle mono">SELECT A COUPON TO RENDER THE BARCODE</div>
            </div>
            <div className="compliment-list-count mono">{compliments.length} FOUND</div>
          </div>

        <div className="compliments-list">
          {loading && !compliments.length ? (
            <div className="compliment-empty mono">LOADING PASS LIST...</div>
          ) : compliments.length ? (
            compliments.map((item) => {
              const id = String(item.complimentId ?? item.id);
              const isActive = String(selectedComplimentId ?? '') === id;

              return (
                <button
                  key={id}
                  type="button"
                  className={`compliment-list-card ${isActive ? 'compliment-list-card-active' : ''}`}
                  onClick={() => setSelectedComplimentId(id)}
                >
                  <div className="compliment-list-card-head">
                    <div>
                      <div className="compliment-list-name">{item.name}</div>
                      <div className="compliment-list-meta mono">
                        {item.couponCode} • {item.rewardText}
                      </div>
                    </div>
                    <div className={`compliment-status-pill compliment-status-pill-${getComplimentStatusTone(item.status)}`}>
                      {item.status}
                    </div>
                  </div>

                  <div className="compliment-list-barcode mono">{item.barcodeValue}</div>
                  <div className="compliment-list-sub mono">
                    {item.discountValue !== null && typeof item.discountValue !== 'undefined'
                      ? `DISCOUNT ${item.discountValue}${item.discountType ? ` ${item.discountType}` : ''}`
                      : item.rewardText}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="compliment-empty mono">NO COMPLIMENT PASSES MATCH THE CURRENT FILTER</div>
          )}
        </div>
      </section>
    </div>
  );
}

function AttendanceView({
  dashboard,
  selectedBranch,
  selectedBranchId,
  onSelectBranch,
  onClearBranch,
  attendanceDate,
  onAttendanceDateChange,
}) {
  const branchLocations = dashboard?.branchLocations || [];
  const attendanceRecords = dashboard?.attendanceRecords || [];
  const timetableSections = dashboard?.clocksterTimetable?.sections || [];
  const scopeLabel = selectedBranch?.name || dashboard?.scopeLabel || 'COMPANY PREVIEW';
  const [staffSearch, setStaffSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState(String(selectedBranchId ?? 'all'));

  useEffect(() => {
    setBranchFilter(String(selectedBranchId ?? 'all'));
  }, [selectedBranchId]);

  const attendanceRows = useMemo(() => buildAttendanceRows(attendanceRecords), [attendanceRecords]);
  const visibleRows = useMemo(() => {
    const query = staffSearch.trim().toLowerCase();

    return attendanceRows.filter((row) => {
      if (statusFilter !== 'all' && row.statusKey !== statusFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        row.displayName,
        row.staffCode,
        row.locationTitle,
        row.statusLabel,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [attendanceRows, staffSearch, statusFilter]);

  const onSiteCount = attendanceRows.filter((row) => row.statusKey === 'open').length;
  const completedCount = attendanceRows.filter((row) => row.statusKey === 'complete').length;
  const lateAbsentCount = attendanceRows.filter((row) => row.statusKey !== 'complete').length;
  const assignmentCards = useMemo(() => buildTimetableAssignments(timetableSections, 4), [timetableSections]);

  const handleBranchChange = (event) => {
    const value = event.target.value;
    setBranchFilter(value);

    if (value === 'all') {
      onClearBranch();
      return;
    }

    const nextBranch = branchLocations.find((branch) => String(getBranchStoreId(branch)) === value) || null;

    if (nextBranch) {
      onSelectBranch(nextBranch);
    }
  };

  const displayAttendanceDate = toInputDate(attendanceDate);

  return (
    <div className="route-grid route-grid-management route-grid-attendance">
      <section className="panel management-panel management-main-panel">
        <div className="management-hero">
          <div>
            <div className="panel-title">ATTENDANCE</div>
            <div className="panel-subtitle mono">DAILY ATTENDANCE LIST</div>
          </div>
          <div className="management-hero-tools">
            <label className="management-filter">
              <span className="mono">SEARCH STAFF ID</span>
              <input
                type="search"
                className="management-search-input"
                value={staffSearch}
                onChange={(event) => setStaffSearch(event.target.value)}
                placeholder="Search Staff ID..."
              />
            </label>
            <label className="attendance-date-control mono">
              <span>DATE</span>
              <input
                type="date"
                className="attendance-date-input"
                value={displayAttendanceDate}
                onChange={(event) => onAttendanceDateChange(event.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="management-filter-row">
          <label className="management-filter">
            <span className="mono">BRANCH</span>
            <select className="management-select" value={branchFilter} onChange={handleBranchChange}>
              <option value="all">Company Preview</option>
              {branchLocations.map((branch, index) => {
                const branchId = getBranchStoreId(branch);
                const branchLabel = branch.name || branch.code || branch.location || `Branch ${index + 1}`;
                return (
                  <option key={`${branchId ?? index}`} value={String(branchId ?? '')}>
                    {branchLabel}
                  </option>
                );
              })}
            </select>
          </label>

          <div className="management-chip-row">
            {[
              { key: 'all', label: 'ALL' },
              { key: 'open', label: 'ON-SITE' },
              { key: 'complete', label: 'COMPLETED' },
              { key: 'absent', label: 'LATE / ABSENT' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                className={`management-chip ${statusFilter === item.key ? 'management-chip-active' : ''}`}
                onClick={() => setStatusFilter(item.key)}
                aria-pressed={statusFilter === item.key}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="attendance-stat-grid">
          <div className="attendance-stat-card attendance-stat-card-accent">
            <div className="attendance-stat-card-label mono">ON-SITE</div>
            <div className="attendance-stat-card-value">{onSiteCount}</div>
            <div className="attendance-stat-card-foot mono">ACTIVE CHECK-INS</div>
          </div>
          <div className="attendance-stat-card attendance-stat-card-warn">
            <div className="attendance-stat-card-label mono">LATE / ABSENT</div>
            <div className="attendance-stat-card-value">{lateAbsentCount}</div>
            <div className="attendance-stat-card-foot mono">ACTION REQUIRED</div>
          </div>
          <div className="attendance-stat-card">
            <div className="attendance-stat-card-label mono">COMPLETED</div>
            <div className="attendance-stat-card-value">{completedCount}</div>
            <div className="attendance-stat-card-foot mono">CLOCK OUTS RECORDED</div>
          </div>
        </div>

        <div className="attendance-table-shell">
          <div className="attendance-table-head">
            <div className="attendance-table-title">DAILY ATTENDANCE LIST</div>
            <div className="attendance-table-meta mono">{visibleRows.length} RECORDS • {scopeLabel}</div>
          </div>
          <div className="attendance-table">
            <div className="attendance-table-row attendance-table-row-head">
              <div>STAFF MEMBER</div>
              <div>CHECK IN</div>
              <div>CHECK OUT</div>
              <div>STATUS</div>
            </div>

            {visibleRows.length ? (
              visibleRows.slice(0, 12).map((row) => (
                <article key={row.key} className={`attendance-table-row attendance-table-row-${row.statusTone}`}>
                  <div className="attendance-table-staff">
                    {row.user?.photo ? (
                      <img src={row.user.photo} alt={row.displayName} className="attendance-table-avatar" loading="lazy" />
                    ) : (
                      <div className="attendance-table-avatar attendance-table-avatar-fallback">
                        {row.displayName
                          .split(' ')
                          .slice(0, 2)
                          .map((part) => part.charAt(0))
                          .join('')
                          .toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="attendance-table-name">{row.displayName}</div>
                      <div className="attendance-table-code mono">ID: {row.staffCode}</div>
                      <div className="attendance-table-location mono">{row.locationTitle}</div>
                    </div>
                  </div>
                  <div className="attendance-table-time mono">{row.checkIn ? formatClockLabel(row.checkIn) : '--:--'}</div>
                  <div className="attendance-table-time mono">{row.checkOut ? formatClockLabel(row.checkOut) : '--:--'}</div>
                  <div>
                    <span className={`attendance-status-pill attendance-status-pill-${row.statusTone}`}>
                      {row.statusLabel}
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <div className="attendance-empty mono">NO ATTENDANCE RECORDS MATCH THIS FILTER.</div>
            )}
          </div>
        </div>
      </section>

      <aside className="panel management-panel management-side-panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">ACTIVE ASSIGNMENTS</div>
            <div className="panel-subtitle mono">CLOCKSTER TIMETABLE SNAPSHOT</div>
          </div>
          <div className="panel-meta">{assignmentCards.length} ITEMS</div>
        </div>

        <div className="attendance-side-stats">
          <div className="attendance-side-stat">
            <span className="mono">ON-SITE</span>
            <strong>{onSiteCount}</strong>
          </div>
          <div className="attendance-side-stat">
            <span className="mono">COMPLETED</span>
            <strong>{completedCount}</strong>
          </div>
        </div>

        <div className="assignment-stack">
          {assignmentCards.length ? (
            assignmentCards.map((item) => (
              <article key={`${item.sectionKey}-${item.time}-${item.day}`} className="assignment-card">
                <div className="assignment-card-head">
                  <div className="assignment-card-day">{item.day}</div>
                  <div className="assignment-card-time mono">{item.time}</div>
                </div>
                <div className="assignment-card-body">{item.text}</div>
              </article>
            ))
          ) : (
            <div className="attendance-empty mono">NO ACTIVE ASSIGNMENTS AVAILABLE.</div>
          )}
        </div>
      </aside>
    </div>
  );
}

function TimetableView({
  dashboard,
  selectedBranch,
  selectedBranchId,
  onSelectBranch,
  onClearBranch,
  attendanceDate,
  onAttendanceDateChange,
  timetableDateStart,
  timetableDateEnd,
  onApplyTimetableRange = () => {},
}) {
  const branchLocations = dashboard?.branchLocations || [];
  const clocksterTimetable = dashboard?.clocksterTimetable || null;
  const timetableRecords = Array.isArray(clocksterTimetable?.records) ? clocksterTimetable.records : [];
  const scopeLabel = selectedBranch?.name || dashboard?.scopeLabel || 'COMPANY PREVIEW';
  const [timetableSearch, setTimetableSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState(String(selectedBranchId ?? 'all'));
  const [rangeDraft, setRangeDraft] = useState(() => ({
    start: timetableDateStart || clocksterTimetable?.dateStart || attendanceDate,
    end: timetableDateEnd || clocksterTimetable?.dateEnd || attendanceDate,
  }));

  useEffect(() => {
    setBranchFilter(String(selectedBranchId ?? 'all'));
  }, [selectedBranchId]);

  useEffect(() => {
    setRangeDraft({
      start: timetableDateStart || clocksterTimetable?.dateStart || attendanceDate,
      end: timetableDateEnd || clocksterTimetable?.dateEnd || attendanceDate,
    });
  }, [
    attendanceDate,
    clocksterTimetable?.dateEnd,
    clocksterTimetable?.dateStart,
    timetableDateEnd,
    timetableDateStart,
  ]);

  const timetableRange = useMemo(() => {
    const dateStart = timetableDateStart || clocksterTimetable?.dateStart || attendanceDate;
    const dateEnd = timetableDateEnd || clocksterTimetable?.dateEnd || attendanceDate;
    return { dateStart, dateEnd };
  }, [
    attendanceDate,
    clocksterTimetable?.dateEnd,
    clocksterTimetable?.dateStart,
    timetableDateEnd,
    timetableDateStart,
  ]);

  const rosterModel = useMemo(
    () => buildClocksterRosterRows(timetableRecords, timetableRange),
    [timetableRecords, timetableRange]
  );
  const clocksterProxyConfigured = Boolean(clocksterTimetable?.proxyConfigured);
  const clocksterProxyLabel = clocksterProxyConfigured ? 'BACKEND READY' : 'MISSING';
  const [shiftFilter, setShiftFilter] = useState('all');

  const timetableQuery = timetableSearch.trim().toLowerCase();

  const doesCellMatchShiftFilter = (cell) => {
    if (shiftFilter === 'all') {
      return true;
    }

    if (shiftFilter === 'work') {
      return cell.tone === 'good' || cell.tone === 'warn';
    }

    if (shiftFilter === 'leave') {
      return cell.tone === 'bad';
    }

    if (shiftFilter === 'empty') {
      return cell.tone === 'empty';
    }

    return true;
  };

  const handleRangeInputChange = (field) => (event) => {
    const value = event.target.value;
    setRangeDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleApplyRange = () => {
    const draftStart = rangeDraft.start || attendanceDate;
    const draftEnd = rangeDraft.end || draftStart;
    const startDate = parseRosterDate(draftStart);
    const endDate = parseRosterDate(draftEnd);

    if (!startDate || !endDate) {
      return;
    }

    const normalizedStart = startDate <= endDate ? draftStart : draftEnd;
    const normalizedEnd = startDate <= endDate ? draftEnd : draftStart;

    setRangeDraft({
      start: normalizedStart,
      end: normalizedEnd,
    });

    onApplyTimetableRange({
      dateStart: normalizedStart,
      dateEnd: normalizedEnd,
    });
  };

  const filteredRosterRows = useMemo(() => {
    const matchedRows = rosterModel.rows.filter((row) => {
      const rowHaystack = [
        row.displayName,
        row.staffCode,
        row.primaryRole,
        ...row.cells.flatMap((cell) => [cell.title, cell.detail, cell.badge, cell.attendanceLabel]),
      ]
        .join(' ')
        .toLowerCase();

      if (!timetableQuery) {
        return true;
      }

      return rowHaystack.includes(timetableQuery);
    });

    if (shiftFilter === 'all') {
      return matchedRows;
    }

    return matchedRows.filter((row) => {
      return row.cells.some((cell) => doesCellMatchShiftFilter(cell));
    });
  }, [rosterModel.rows, shiftFilter, timetableQuery]);

  const monthLabel = formatRosterMonthLabel(timetableRange.dateStart, timetableRange.dateEnd);
  const totalPlannedSeconds = filteredRosterRows.reduce(
    (sum, row) => sum + row.cells.reduce((cellSum, cell) => {
      const scheduled = Number(cell.dayValue?.schedule?.time_planned || 0);
      return cell.tone === 'good' || cell.tone === 'warn' ? cellSum + scheduled : cellSum;
    }, 0),
    0
  );

  const handleBranchChange = (event) => {
    const value = event.target.value;
    setBranchFilter(value);

    if (value === 'all') {
      onClearBranch();
      return;
    }

    const nextBranch = branchLocations.find((branch) => String(getBranchStoreId(branch)) === value) || null;

    if (nextBranch) {
      onSelectBranch(nextBranch);
    }
  };

  return (
    <div className="route-grid route-grid-management route-grid-timetable timetable-stage">
      <section className="panel management-panel management-main-panel timetable-panel">
        <div className="timetable-hero">
          <div className="timetable-hero-copy">
            <div className="panel-title timetable-panel-title">SHIFT ROSTER</div>
            <div className="panel-subtitle mono">CLOCKSTER ROSTER OVERVIEW</div>
            <div className="timetable-hero-meta">
              <span>{scopeLabel}</span>
              <span>{monthLabel}</span>
              <span>{filteredRosterRows.length} STAFF</span>
            </div>
          </div>

          <div className="timetable-hero-actions">
            <button className="timetable-action timetable-action-secondary" type="button">
              AUTO-GENERATE
            </button>
            <button className="timetable-action timetable-action-primary" type="button">
              ADD SHIFT
            </button>
          </div>
        </div>

        <div className="timetable-top-metrics">
          <div className="timetable-top-metric">
            <span>TOTAL HOURS</span>
            <strong>{formatHoursValue(totalPlannedSeconds)}</strong>
          </div>
          <div className="timetable-top-metric">
            <span>STAFF ACTIVE</span>
            <strong>{filteredRosterRows.length}</strong>
          </div>
        </div>

        <div className="timetable-toolbar">
          <label className="management-filter timetable-search">
            <span className="mono">SEARCH ROSTER</span>
            <input
              type="search"
              className="management-search-input timetable-search-input"
              value={timetableSearch}
              onChange={(event) => setTimetableSearch(event.target.value)}
              placeholder="Search staff, shift, or leave..."
            />
          </label>

          <label className="management-filter timetable-branch">
            <span className="mono">BRANCH</span>
            <select className="management-select" value={branchFilter} onChange={handleBranchChange}>
              <option value="all">Company Preview</option>
              {branchLocations.map((branch, index) => {
                const branchId = getBranchStoreId(branch);
                const branchLabel = branch.name || branch.code || branch.location || `Branch ${index + 1}`;
                return (
                  <option key={`${branchId ?? index}`} value={String(branchId ?? '')}>
                    {branchLabel}
                  </option>
                );
              })}
            </select>
          </label>

          <div className="timetable-shift-tabs">
            {[
              { key: 'all', label: 'ALL' },
              { key: 'work', label: 'WORK' },
              { key: 'leave', label: 'LEAVE' },
              { key: 'empty', label: 'EMPTY' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                className={`timetable-tab ${shiftFilter === item.key ? 'timetable-tab-active' : ''}`}
                onClick={() => setShiftFilter(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className={`timetable-proxy-pill ${clocksterProxyConfigured ? 'timetable-proxy-pill-ready' : 'timetable-proxy-pill-alert'}`}>
            <span className="mono">PROXY</span>
            <strong>{clocksterProxyLabel}</strong>
          </div>

          <div className="timetable-range-controls">
            <label className="management-filter timetable-range-field">
              <span className="mono">START DATE</span>
              <input
                type="date"
                className="management-search-input timetable-range-input"
                value={rangeDraft.start || ''}
                onChange={handleRangeInputChange('start')}
              />
            </label>
            <label className="management-filter timetable-range-field">
              <span className="mono">END DATE</span>
              <input
                type="date"
                className="management-search-input timetable-range-input"
                value={rangeDraft.end || ''}
                onChange={handleRangeInputChange('end')}
              />
            </label>
            <button className="timetable-action timetable-action-primary timetable-range-apply" type="button" onClick={handleApplyRange}>
              APPLY RANGE
            </button>
          </div>
        </div>

        <div className="timetable-board-shell">
          <div className="timetable-board-scroll">
            {rosterModel.dateKeys.length ? (
              <div
                className="timetable-board"
                style={{ gridTemplateColumns: `280px repeat(${rosterModel.dateKeys.length}, minmax(146px, 1fr))` }}
              >
                <div className="timetable-board-head timetable-board-head-staff">
                  <span>STAFF / ROLE</span>
                </div>

                {rosterModel.dateKeys.map((dateKey) => {
                  const parts = formatRosterHeaderParts(dateKey);
                  const isToday = dateKey === attendanceDate;

                  return (
                    <div
                      key={dateKey}
                      className={`timetable-board-head ${isToday ? 'timetable-board-head-today' : ''}`}
                    >
                      <span className="timetable-board-head-weekday">{parts.weekday}</span>
                      <strong className="timetable-board-head-day">{parts.day}</strong>
                    </div>
                  );
                })}

                {filteredRosterRows.length ? (
                  filteredRosterRows.map((row) => (
                    <Fragment key={row.key}>
                      <div className="timetable-board-staff">
                        {row.user?.photo ? (
                          <img src={row.user.photo} alt={row.displayName} className="timetable-board-avatar" loading="lazy" />
                        ) : (
                          <div className="timetable-board-avatar timetable-board-avatar-fallback">
                            {row.displayName
                              .split(' ')
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((part) => part[0])
                              .join('')
                              .toUpperCase()}
                          </div>
                        )}
                        <div className="timetable-board-staff-copy">
                          <div className="timetable-board-name">{row.displayName}</div>
                          <div className="timetable-board-role mono">{row.primaryRole}</div>
                          <div className="timetable-board-code mono">ID: {row.staffCode}</div>
                        </div>
                      </div>

                      {row.cells.map((cell) => (
                        <article
                          key={`${row.key}-${cell.key}`}
                          className={`timetable-board-cell timetable-board-cell-${cell.tone} ${
                            doesCellMatchShiftFilter(cell) ? '' : 'timetable-board-cell-filtered'
                          }`}
                          aria-hidden={!doesCellMatchShiftFilter(cell)}
                        >
                          {doesCellMatchShiftFilter(cell) ? (
                            <>
                              <div className="timetable-board-cell-time mono">
                                {cell.tone === 'empty' ? 'OFF' : cell.detail}
                              </div>
                              <div className="timetable-board-cell-title">{cell.title}</div>
                              <div className="timetable-board-cell-meta mono">{cell.attendanceLabel}</div>
                            </>
                          ) : null}
                        </article>
                      ))}
                    </Fragment>
                  ))
                ) : (
                  <div className="timetable-board-empty">
                    NO STAFF MATCH THIS FILTER.
                  </div>
                )}
              </div>
            ) : (
              <div className="attendance-empty mono">NO TIMETABLE DATA AVAILABLE.</div>
            )}
          </div>
        </div>

        <div className="timetable-footer">
          <div className="timetable-legend">
            <span><i className="timetable-legend-swatch timetable-legend-work" /> WORK SHIFT</span>
            <span><i className="timetable-legend-swatch timetable-legend-leave" /> LEAVE</span>
            <span><i className="timetable-legend-swatch timetable-legend-empty" /> EMPTY</span>
            <span><i className="timetable-legend-swatch timetable-legend-accent" /> TODAY</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function StockOpnameView({ dashboard }) {
  const branches = Array.isArray(dashboard?.branchLocations) ? dashboard.branchLocations : [];
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [state, setState] = useState({ items: [], loading: true, error: '', savingId: null, message: '' });
  const [counts, setCounts] = useState({});
  const selectedBranch = branches.find((branch) => String(getBranchStoreId(branch) ?? '') === selectedBranchId) || null;

  useEffect(() => {
    let cancelled = false;

    loadInventoryCatalog()
      .then((result) => {
        if (cancelled) return;
        const items = Array.isArray(result?.items) ? result.items : [];
        setState({ items, loading: false, error: '', savingId: null, message: '' });
        setCounts(Object.fromEntries(items.map((item) => [item.id, String(item.quantity ?? 0)])));
      })
      .catch((error) => {
        if (cancelled) return;
        setState({ items: [], loading: false, error: error instanceof Error ? error.message : 'Failed to load stock opname', savingId: null, message: '' });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const branchItems = useMemo(() => {
    if (!selectedBranchId) return state.items;
    return state.items.filter((item) => String(item.branchId ?? '') === selectedBranchId);
  }, [selectedBranchId, state.items]);

  const opnameRows = branchItems.map((item) => {
    const counted = Number(counts[item.id] ?? item.quantity ?? 0);
    const system = Number(item.quantity || 0);
    const variance = counted - system;
    return { item, counted, system, variance, valueVariance: variance * Number(item.unitCost || 0) };
  });
  const totalVariance = opnameRows.reduce((sum, row) => sum + row.variance, 0);
  const totalValueVariance = opnameRows.reduce((sum, row) => sum + row.valueVariance, 0);

  const handlePostCount = async (row) => {
    setState((current) => ({ ...current, savingId: row.item.id, message: '', error: '' }));

    try {
      const updated = await updateInventoryStockCount({
        itemId: row.item.id,
        systemQuantity: row.system,
        countedQuantity: row.counted,
        branchName: selectedBranch?.name || selectedBranch?.code || 'All branches',
      });

      setState((current) => ({
        ...current,
        items: current.items.map((item) => (item.id === updated.id ? updated : item)),
        savingId: null,
        message: `${updated.itemName || 'Item'} count posted.`,
      }));
      setCounts((current) => ({ ...current, [updated.id]: String(updated.quantity ?? 0) }));
    } catch (error) {
      setState((current) => ({
        ...current,
        savingId: null,
        error: error instanceof Error ? error.message : 'Failed to post stock opname',
      }));
    }
  };

  return (
    <div className="route-grid route-grid-accounting">
      <section className="panel finance-hero-panel">
        <div className="panel-head">
          <div>
            <div className="panel-title finance-panel-title">STOCK OPNAME</div>
            <div className="panel-subtitle mono">COUNT STOCK PER BRANCH • POST VARIANCE TO INVENTORY</div>
          </div>
          <select className="opname-select" value={selectedBranchId} onChange={(event) => setSelectedBranchId(event.target.value)}>
            <option value="">All branches</option>
            {branches.map((branch, index) => (
              <option key={getBranchStoreId(branch) ?? index} value={getBranchStoreId(branch) ?? ''}>
                {branch.name || branch.code || `Branch ${index + 1}`}
              </option>
            ))}
          </select>
        </div>

        <div className="finance-kpi-grid">
          <article className="finance-kpi-card"><div className="finance-kpi-label mono">ITEMS COUNTED</div><div className="finance-kpi-value">{opnameRows.length}</div><div className="finance-kpi-note">Filtered inventory lines</div></article>
          <article className="finance-kpi-card"><div className="finance-kpi-label mono">QTY VARIANCE</div><div className="finance-kpi-value">{totalVariance}</div><div className="finance-kpi-note">Counted minus system stock</div></article>
          <article className="finance-kpi-card"><div className="finance-kpi-label mono">VALUE VARIANCE</div><div className="finance-kpi-value">{formatRupiah(totalValueVariance)}</div><div className="finance-kpi-note">Based on unit cost</div></article>
          <article className="finance-kpi-card"><div className="finance-kpi-label mono">BRANCH</div><div className="finance-kpi-value">{selectedBranch ? (selectedBranch.code || selectedBranch.name) : 'ALL'}</div><div className="finance-kpi-note">{selectedBranch?.name || 'Company wide opname'}</div></article>
        </div>
      </section>

      <section className="panel accounting-wide-panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">COUNT SHEET</div>
            <div className="panel-subtitle mono">SYSTEM QTY / PHYSICAL COUNT / VARIANCE</div>
          </div>
          {state.message ? <div className="panel-meta">{state.message}</div> : null}
        </div>
        {state.loading ? <div className="finance-empty mono">LOADING STOCK OPNAME...</div> : null}
        {state.error ? <div className="finance-empty mono">{state.error}</div> : null}
        <div className="opname-table">
          <div className="opname-head mono"><span>Item</span><span>Branch</span><span>System</span><span>Count</span><span>Variance</span><span>Action</span></div>
          {opnameRows.map((row) => (
            <div key={row.item.id} className="opname-row">
              <strong>{row.item.itemName}</strong>
              <span>{row.item.branchId || 'GLOBAL'}</span>
              <span>{row.system} {row.item.unit}</span>
              <input type="number" min="0" value={counts[row.item.id] ?? ''} onChange={(event) => setCounts((current) => ({ ...current, [row.item.id]: event.target.value }))} />
              <span className={row.variance === 0 ? 'finance-tone-good' : 'finance-tone-warn'}>{row.variance}</span>
              <button type="button" className="opname-button" disabled={state.savingId === row.item.id || row.variance === 0} onClick={() => handlePostCount(row)}>
                {state.savingId === row.item.id ? 'Posting' : 'Post'}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function AccountingView({ dashboard }) {
  const branches = Array.isArray(dashboard?.branchLocations) ? dashboard.branchLocations : [];
  const today = new Date().toISOString().slice(0, 10);
  const [state, setState] = useState({ accounts: [], journals: [], loading: true, error: '', message: '' });
  const [accountForm, setAccountForm] = useState({ code: '', name: '', type: 'asset' });
  const [journalForm, setJournalForm] = useState({
    journalDate: today,
    description: '',
    branchId: '',
    lines: [
      { accountCode: '1000', debit: '', credit: '' },
      { accountCode: '4000', debit: '', credit: '' },
    ],
  });

  const reloadAccounting = async () => {
    const result = await loadAccountingSystem();
    setState({ accounts: result.accounts, journals: result.journals, loading: false, error: '', message: '' });
  };

  useEffect(() => {
    reloadAccounting().catch((error) => setState({ accounts: [], journals: [], loading: false, error: error instanceof Error ? error.message : 'Failed to load accounting', message: '' }));
  }, []);

  const accountMap = new Map(state.accounts.map((account) => [String(account.code), account]));
  const totalDebit = journalForm.lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
  const totalCredit = journalForm.lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);

  const submitAccount = async (event) => {
    event.preventDefault();
    const account = await createAccountingAccount(accountForm);
    setState((current) => ({ ...current, accounts: [...current.accounts, account].sort((a, b) => String(a.code).localeCompare(String(b.code))), message: 'Account created.', error: '' }));
    setAccountForm({ code: '', name: '', type: 'asset' });
  };

  const submitJournal = async (event) => {
    event.preventDefault();
    const journal = await createAccountingJournal({
      ...journalForm,
      branchId: journalForm.branchId || null,
      lines: journalForm.lines.map((line) => ({ ...line, accountName: accountMap.get(String(line.accountCode))?.name || '' })),
    });
    setState((current) => ({ ...current, journals: [journal, ...current.journals], message: 'Journal posted.', error: '' }));
    setJournalForm((current) => ({ ...current, description: '', lines: current.lines.map((line) => ({ ...line, debit: '', credit: '' })) }));
  };

  return (
    <div className="route-grid route-grid-accounting">
      <section className="panel finance-hero-panel">
        <div className="panel-head">
          <div>
            <div className="panel-title finance-panel-title">ACCOUNTING SYSTEM</div>
            <div className="panel-subtitle mono">CHART OF ACCOUNTS • JOURNAL ENTRY</div>
          </div>
          <div className="panel-meta">{state.accounts.length} COA</div>
        </div>
        {state.loading ? <div className="finance-empty mono">LOADING ACCOUNTING...</div> : null}
        {state.error ? <div className="finance-empty mono">{state.error}</div> : null}
        {state.message ? <div className="finance-empty mono">{state.message}</div> : null}
      </section>

      <section className="panel accounting-form-panel">
        <div className="panel-title">NEW ACCOUNT</div>
        <form className="accounting-form" onSubmit={submitAccount}>
          <input value={accountForm.code} onChange={(event) => setAccountForm((current) => ({ ...current, code: event.target.value }))} placeholder="Account code" required />
          <input value={accountForm.name} onChange={(event) => setAccountForm((current) => ({ ...current, name: event.target.value }))} placeholder="Account name" required />
          <select value={accountForm.type} onChange={(event) => setAccountForm((current) => ({ ...current, type: event.target.value }))}>
            <option value="asset">Asset</option><option value="liability">Liability</option><option value="equity">Equity</option><option value="income">Income</option><option value="expense">Expense</option>
          </select>
          <button type="submit" className="opname-button">Create COA</button>
        </form>
      </section>

      <section className="panel accounting-form-panel">
        <div className="panel-title">NEW JOURNAL</div>
        <form className="accounting-form" onSubmit={submitJournal}>
          <input type="date" value={journalForm.journalDate} onChange={(event) => setJournalForm((current) => ({ ...current, journalDate: event.target.value }))} required />
          <select value={journalForm.branchId} onChange={(event) => setJournalForm((current) => ({ ...current, branchId: event.target.value }))}>
            <option value="">All branches</option>
            {branches.map((branch, index) => <option key={getBranchStoreId(branch) ?? index} value={getBranchStoreId(branch) ?? ''}>{branch.name || branch.code || `Branch ${index + 1}`}</option>)}
          </select>
          <input value={journalForm.description} onChange={(event) => setJournalForm((current) => ({ ...current, description: event.target.value }))} placeholder="Description" required />
          {journalForm.lines.map((line, index) => (
            <div className="journal-line" key={`line-${index}`}>
              <select value={line.accountCode} onChange={(event) => setJournalForm((current) => ({ ...current, lines: current.lines.map((item, itemIndex) => itemIndex === index ? { ...item, accountCode: event.target.value } : item) }))}>
                {state.accounts.map((account) => <option key={account.code} value={account.code}>{account.code} - {account.name}</option>)}
              </select>
              <input type="number" min="0" value={line.debit} onChange={(event) => setJournalForm((current) => ({ ...current, lines: current.lines.map((item, itemIndex) => itemIndex === index ? { ...item, debit: event.target.value } : item) }))} placeholder="Debit" />
              <input type="number" min="0" value={line.credit} onChange={(event) => setJournalForm((current) => ({ ...current, lines: current.lines.map((item, itemIndex) => itemIndex === index ? { ...item, credit: event.target.value } : item) }))} placeholder="Credit" />
            </div>
          ))}
          <div className="finance-net-row"><span>Balance</span><strong>{formatRupiah(totalDebit)} / {formatRupiah(totalCredit)}</strong></div>
          <button type="submit" className="opname-button" disabled={Math.round(totalDebit * 100) !== Math.round(totalCredit * 100)}>Post Journal</button>
        </form>
      </section>

      <section className="panel accounting-wide-panel">
        <div className="panel-title">CHART OF ACCOUNTS</div>
        <div className="opname-table">
          <div className="coa-head mono"><span>Code</span><span>Name</span><span>Type</span><span>Normal</span></div>
          {state.accounts.map((account) => <div key={account.code} className="coa-row"><strong>{account.code}</strong><span>{account.name}</span><span>{account.type}</span><span>{account.normalBalance}</span></div>)}
        </div>
      </section>

      <section className="panel accounting-wide-panel">
        <div className="panel-title">JOURNAL LIST</div>
        <div className="opname-table">
          <div className="journal-head mono"><span>No</span><span>Date</span><span>Description</span><span>Debit</span><span>Credit</span></div>
          {state.journals.map((journal) => <div key={journal.id} className="journal-row"><strong>{journal.journalNo}</strong><span>{journal.journalDate}</span><span>{journal.description}</span><span>{formatRupiah(journal.totalDebit)}</span><span>{formatRupiah(journal.totalCredit)}</span></div>)}
        </div>
      </section>
    </div>
  );
}

function FinanceView({ dashboard }) {
  const overview = buildFinanceOverview(dashboard);
  const { incomeRows, expenseRows } = buildFinanceRows(overview);
  const ledgerRows = buildLedgerRows(overview);
  const totalDebits = ledgerRows.reduce((sum, row) => sum + Number(row.debit || 0), 0);
  const totalCredits = ledgerRows.reduce((sum, row) => sum + Number(row.credit || 0), 0);
  const branchRows = overview.branchLocations.slice(0, 5);
  const targetProgress = overview.branchTargets > 0
    ? Math.min((overview.revenueMonth / overview.branchTargets) * 100, 100)
    : 0;
  const expenseRatio = overview.revenueMonth > 0
    ? Math.min((overview.monthlyExpenses / overview.revenueMonth) * 100, 100)
    : 0;
  const cashflowRows = [
    { label: 'Cash In', value: overview.revenueMonth + overview.receivables, tone: 'good' },
    { label: 'Cash Out', value: overview.monthlyExpenses + overview.payables, tone: 'warn' },
    { label: 'Net Cash', value: overview.cashInBank, tone: overview.cashInBank > 0 ? 'good' : 'bad' },
  ];
  const kpis = [
    { label: 'Month Revenue', value: formatRupiah(overview.revenueMonth), note: `${overview.completedToday} completed today` },
    { label: 'Gross Profit', value: formatRupiah(overview.grossProfit), note: `${formatPercentValue(overview.margin, 1)} margin` },
    { label: 'Receivables', value: formatRupiah(overview.receivables), note: 'Customer balance estimate' },
    { label: 'Payables', value: formatRupiah(overview.payables), note: 'Supplier and expense accruals' },
  ];

  return (
    <div className="route-grid route-grid-finance">
      <section className="panel finance-hero-panel">
        <div className="panel-head">
          <div>
            <div className="panel-title finance-panel-title">FINANCE & ACCOUNTING</div>
            <div className="panel-subtitle mono">P&L • CASHFLOW • LEDGER CONTROL</div>
          </div>
          <div className="panel-meta">MONTH CLOSE</div>
        </div>

        <div className="finance-kpi-grid">
          {kpis.map((item) => (
            <article key={item.label} className="finance-kpi-card">
              <div className="finance-kpi-label mono">{item.label}</div>
              <div className="finance-kpi-value">{item.value}</div>
              <div className="finance-kpi-note">{item.note}</div>
            </article>
          ))}
        </div>

        <div className="finance-profit-card">
          <div>
            <div className="finance-profit-label mono">TARGET ACHIEVEMENT</div>
            <div className="finance-profit-value">
              {overview.branchTargets > 0 ? formatPercentValue(targetProgress, 1) : 'N/A'}
            </div>
          </div>
          <div className="finance-profit-copy">
            {overview.branchTargets > 0
              ? `${formatRupiah(overview.targetGap)} remaining against configured branch targets.`
              : 'No branch targets are configured in the current data stream.'}
          </div>
          <div className="finance-progress-bar" aria-hidden="true">
            <span style={{ width: `${targetProgress}%` }} />
          </div>
        </div>
      </section>

      <section className="panel finance-statement-panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">PROFIT & LOSS</div>
            <div className="panel-subtitle mono">REVENUE AND OPERATING COST SUMMARY</div>
          </div>
          <div className="panel-meta">{formatPercentValue(expenseRatio, 1)} COST RATIO</div>
        </div>

        <div className="finance-statement-grid">
          <div className="finance-statement-column">
            <div className="finance-section-title mono">INCOME</div>
            {incomeRows.map((row) => (
              <div key={row.label} className="finance-statement-row">
                <span>{row.label}</span>
                <strong className={`finance-tone-${row.tone}`}>{formatRupiah(row.value)}</strong>
              </div>
            ))}
          </div>

          <div className="finance-statement-column">
            <div className="finance-section-title mono">EXPENSES</div>
            {expenseRows.map((row) => (
              <div key={row.label} className="finance-statement-row">
                <span>{row.label}</span>
                <strong className={`finance-tone-${row.tone}`}>{formatRupiah(row.value)}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="finance-net-row">
          <span>Net operating profit</span>
          <strong>{formatRupiah(overview.grossProfit)}</strong>
        </div>
      </section>

      <aside className="panel finance-side-panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">CASHFLOW</div>
            <div className="panel-subtitle mono">BANK • AR • AP SNAPSHOT</div>
          </div>
        </div>

        <div className="finance-cashflow-list">
          {cashflowRows.map((row) => (
            <div key={row.label} className="finance-cashflow-row">
              <span className={`finance-cashflow-dot finance-cashflow-${row.tone}`} />
              <div>
                <div className="finance-cashflow-label">{row.label}</div>
                <div className="finance-cashflow-value">{formatRupiah(row.value)}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="finance-branch-targets">
          <div className="finance-section-title mono">BRANCH TARGETS</div>
          {branchRows.length ? branchRows.map((branch, index) => {
            const target = parseNumericValue(branch.monthlyTarget);
            const progress = target > 0 ? Math.min((overview.revenueMonth / Math.max(overview.branchTargets, 1)) * 100, 100) : 0;
            const branchName = branch.name || branch.code || `Branch ${index + 1}`;

            return (
              <div key={branch.id || branch.code || `${branchName}-${index}`} className="finance-branch-row">
                <div className="finance-branch-head">
                  <span>{branchName}</span>
                  <strong>{target > 0 ? formatRupiah(target) : 'N/A'}</strong>
                </div>
                <div className="finance-mini-bar" aria-hidden="true">
                  <span style={{ width: `${progress}%` }} />
                </div>
              </div>
            );
          }) : (
            <div className="finance-empty mono">NO BRANCH TARGET DATA AVAILABLE.</div>
          )}
        </div>
      </aside>

      <section className="panel finance-ledger-panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">GENERAL LEDGER</div>
            <div className="panel-subtitle mono">ACCOUNT CODE / DEBIT / CREDIT / STATUS</div>
          </div>
          <div className="panel-meta">{ledgerRows.length} ACCOUNTS</div>
        </div>

        <div className="finance-ledger-table">
          <div className="finance-ledger-head mono">
            <span>Code</span>
            <span>Account</span>
            <span>Debit</span>
            <span>Credit</span>
            <span>Status</span>
          </div>
          {ledgerRows.map((row) => (
            <div key={row.code} className="finance-ledger-row">
              <span className="mono">{row.code}</span>
              <strong>{row.account}</strong>
              <span>{row.debit > 0 ? formatRupiah(row.debit) : '-'}</span>
              <span>{row.credit > 0 ? formatRupiah(row.credit) : '-'}</span>
              <span className="finance-ledger-status mono">{row.status}</span>
            </div>
          ))}
          <div className="finance-ledger-total">
            <span>Total movement</span>
            <strong>{formatRupiah(totalDebits)}</strong>
            <strong>{formatRupiah(totalCredits)}</strong>
          </div>
        </div>
      </section>
    </div>
  );
}

function AnalyticsView({
  dashboard,
  onGenerateInsight,
  alertVisible,
  onDismissAlert,
  selectedDensityIndex,
  onSelectDensityIndex,
  aiInsight,
}) {
  const branchCount = Array.isArray(dashboard?.branchLocations) ? dashboard.branchLocations.length : 0;
  const topService = getTopRevenueService(dashboard);
  const topServiceShare = Number(topService?.percentage || 0);
  const activeServices = Number(dashboard?.activeServices || 0);
  const completedToday = Number(dashboard?.completedToday || 0);
  const monthlyExpenses = Number(dashboard?.monthlyExpenses || 0);
  const profitMargin = Number(dashboard?.profitMargin || 0);
  const revenueToday = Number(dashboard?.revenueToday || 0);
  const revenueMonth = Number(dashboard?.revenueMonth || 0);
  const weeklyEstimate = Number(dashboard?.weeklyEstimate || 0);
  const vehicleTarget = Number(dashboard?.vehicleTarget || 0);
  const monthVehicleCount = Number(dashboard?.monthVehicleCount || 0);
  const targetProgress = vehicleTarget > 0 ? Math.min((monthVehicleCount / vehicleTarget) * 100, 100) : 0;
  const confidenceLabel = dashboard?.confidenceLabel || 'MEDIUM';
  const selectedBranchName = dashboard?.selectedBranch?.name || null;
  const analyticsStats = buildAnalyticsStats(dashboard);
  const topServiceLabel = topService?.serviceType || 'service mix';

  const predictiveCopy = dashboard?.insights?.[0]?.body || (
    topService
      ? `Revenue is concentrated in ${topServiceLabel} at ${topServiceShare.toFixed(1)}% of the current mix. If you want to improve realism in the forecast, compare this package against branch-level throughput and queue time.`
      : branchCount
        ? `The current snapshot covers ${branchCount} branches, but the service mix is still too thin to forecast reliably. Add branch-level sales detail so the model can compare performance by location.`
        : 'No branch data loaded yet. Add live revenue and service breakdown data before using predictive analytics.'
  );

  const maintenanceCopy = dashboard?.insights?.[1]?.body || (
    Number(dashboard?.equipmentIssues || 0) > 0
      ? `${Number(dashboard.equipmentIssues)} equipment issue${Number(dashboard.equipmentIssues) > 1 ? 's are' : ' is'} flagged in the latest backend sweep. Review the oldest open case before the next peak cycle.`
      : 'No active equipment issues are flagged in the latest backend sweep.'
  );

  const liveRevenue = dashboard?.revenueToday || 0;
  const monthlyTargetProgress = targetProgress;
  const scopeLabel = dashboard?.scopeLabel || 'COMPANY PREVIEW';
  const statusLine = dashboard
    ? `${scopeLabel} • ${branchCount} BRANCH${branchCount === 1 ? '' : 'ES'} • ${confidenceLabel} CONFIDENCE`
    : 'LIVE DATA SYNCED';
  const alertTitle = Number(dashboard?.equipmentIssues || 0) > 0
    ? 'MAINTENANCE WATCH'
    : topServiceShare >= 65
      ? 'REVENUE MIX CONCENTRATION'
      : monthlyTargetProgress < 15
        ? 'MONTHLY TARGET LAG'
        : 'OPERATIONS STABLE';
  const alertMetric = dashboard
    ? `TARGET PROGRESS: ${formatPercentValue(monthlyTargetProgress, 1)} • EXPENSES ${formatRupiah(monthlyExpenses)}`
    : 'TARGET PROGRESS: N/A';
  const alertSummary = Number(dashboard?.equipmentIssues || 0) > 0
    ? `Maintenance risk is elevated because ${dashboard.equipmentIssues} equipment issue${Number(dashboard.equipmentIssues) > 1 ? 's are' : ' is'} still open.`
    : topServiceShare >= 65
      ? `The revenue mix is concentrated in ${topServiceLabel}, so queue handling and upsell opportunities matter more than raw traffic.`
      : monthlyTargetProgress < 15
        ? `The month is still early relative to the current branch target, so staffing and conversion are the main levers.`
        : `Operations look stable with ${completedToday} completions today, ${activeServices} active services, and ${formatPercentValue(profitMargin, 1)} profit margin.`;

  return (
    <div className="route-grid route-grid-analytics">
      <div className="footer-strip analytics-top-strip">
        <span>{statusLine}</span>
        <span className="footer-revenue">
          TODAY {formatRupiah(liveRevenue)} • MONTH {formatRupiah(revenueMonth)} • WEEKLY {formatRupiah(weeklyEstimate)}
        </span>
      </div>

      {aiInsight ? (
        <article className="panel ai-insight-panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{aiInsight.title || 'AI INSIGHT'}</div>
              <div className="panel-subtitle mono">LIVE MODEL RESPONSE FROM THE BACKEND</div>
            </div>
            <div className="panel-meta">CONFIDENCE: {aiInsight.confidence || 'MEDIUM'}</div>
          </div>

          <p className="ai-insight-summary">{aiInsight.summary}</p>

          <div className="ai-insight-actions">
            {(aiInsight.actionItems || []).map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </article>
      ) : (
        <article className="panel ai-insight-panel ai-insight-empty">
          <div className="panel-head">
            <div>
              <div className="panel-title">AI INSIGHT</div>
              <div className="panel-subtitle mono">GENERATE A MODEL RESPONSE TO SEE EXECUTIVE RECOMMENDATIONS</div>
            </div>
          </div>
        </article>
      )}

      {alertVisible ? (
        <article className="panel alert-panel">
          <div className="alert-icon">!</div>
          <div className="alert-content">
            <div className="alert-title">AI PREDICTIVE ALERT: {alertTitle}</div>
            <p>{alertSummary}</p>
            <p>{predictiveCopy}</p>
            <p className="alert-note mono">{maintenanceCopy}</p>
            <div className="alert-metric mono">{alertMetric}</div>
            <div className="alert-actions">
              <button className="alert-primary" onClick={onGenerateInsight}>
                DEPLOY RESOURCES
              </button>
              <button className="alert-secondary" type="button" onClick={onDismissAlert}>
                DISMISS
              </button>
            </div>
          </div>
        </article>
      ) : (
        <article className="panel alert-panel alert-panel-muted">
          <div className="alert-icon">✓</div>
          <div className="alert-content">
            <div className="alert-title">ALERT DISMISSED</div>
            <p>
              {dashboard
                ? `${scopeLabel} is currently operating with ${branchCount} loaded branch${branchCount === 1 ? '' : 'es'} and ${confidenceLabel.toLowerCase()} confidence.`
                : 'No active predictive alert is currently displayed.'}
            </p>
          </div>
        </article>
      )}

      <div className="analytics-row">
        <DensityChart
          dashboard={dashboard}
          selectedIndex={selectedDensityIndex}
          onSelectIndex={onSelectDensityIndex}
        />
        <RingCard percent={monthlyTargetProgress} status={`${formatPercentValue(monthlyTargetProgress, 1)} OF MONTH TARGET`} />
      </div>

      <div className="stats-row">
        {analyticsStats.map((item) => (
          <StatCard key={item.label} item={item} />
        ))}
      </div>
    </div>
  );
}

function AssistantView({ dashboard, aiInsight }) {
  const insights = dashboard?.insights || [];
  const topService = dashboard?.revenueBreakdown?.[0];
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: 'I’m online and ready. Ask me about branch locations, revenue, analytics, or operational issues.',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const appendAssistantReply = (reply) => {
    setChatMessages((current) => [
      ...current,
      {
        role: 'assistant',
        content: reply,
      },
    ]);
  };

  const handleSendChat = async (rawText) => {
    const text = typeof rawText === 'string' ? rawText : chatInput;
    const trimmed = text.trim();

    if (!trimmed || chatSending) {
      return;
    }

    const nextMessages = [
      ...chatMessages,
      {
        role: 'user',
        content: trimmed,
      },
    ];

    setChatMessages(nextMessages);
    setChatInput('');
    setChatSending(true);
    setChatError('');

    try {
      const result = await generateAiChat({
        dashboard,
        messages: nextMessages,
      });

      appendAssistantReply(result.reply?.trim() || 'I’m here if you want a deeper operational breakdown.');
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Unable to reach the AI assistant.');
      appendAssistantReply('I could not reach the AI model just now. Please try again.');
    } finally {
      setChatSending(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    handleSendChat();
  };

  return (
    <div className="route-grid route-grid-assistant">
      <section className="panel assistant-panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">AI ASSISTANT</div>
            <div className="panel-subtitle mono">COMMAND CENTER RESPONSE ENGINE</div>
          </div>
        </div>

        <div className="assistant-block">
          <div className="assistant-prompt">What should the system prioritize today?</div>
          <div className="assistant-chips">
            <span>Traffic bottleneck</span>
            <span>Branch ranking</span>
            <span>Revenue forecast</span>
          </div>
        </div>

        <div className="assistant-response">
          <div className="assistant-response-title">Recommended Action</div>
          <p>
            {aiInsight?.summary
              || (topService
              ? `Increase focus on ${topService.serviceType} packages to capture ${topService.percentage?.toFixed?.(1) || 0}% of current revenue mix and improve throughput.`
              : 'Keep branch utilization balanced and push add-on services during peak windows.')}
          </p>
          {aiInsight?.actionItems?.length ? (
            <div className="assistant-ai-list">
              {aiInsight.actionItems.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          ) : null}
          <div className="assistant-response-meta mono">
            WEEKLY ESTIMATE {formatRupiah(dashboard?.weeklyEstimate || 0)}
          </div>
        </div>

        <div className="assistant-chat-preview">
          <div className="assistant-response-title">Quick Chat</div>
          <div className="assistant-chat-preview-copy">
            Ask a follow-up question to get a live answer from the backend model.
          </div>
          <div className="assistant-chat-prompts">
            {CHAT_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="assistant-chat-chip"
                onClick={() => setChatInput(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="panel assistant-chat-panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">AI CHAT</div>
            <div className="panel-subtitle mono">CONVERSATIONAL OPERATOR ASSISTANT</div>
          </div>
          <div className="panel-meta">{chatSending ? 'TYPING...' : 'READY'}</div>
        </div>

        <div className="chat-thread" aria-live="polite">
          {chatMessages.map((message, index) => (
            <article key={`${message.role}-${index}`} className={`chat-message chat-message-${message.role}`}>
              <div className="chat-message-role mono">{message.role === 'assistant' ? 'YCW AI' : 'YOU'}</div>
              <div className="chat-message-bubble">{message.content}</div>
            </article>
          ))}
          <div ref={chatEndRef} />
        </div>

        {chatError ? <div className="chat-error mono">{chatError}</div> : null}

        <div className="assistant-chat-prompts assistant-chat-prompts-inline">
          {CHAT_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="assistant-chat-chip"
              onClick={() => setChatInput(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>

        <form className="chat-form" onSubmit={handleSubmit}>
          <textarea
            className="chat-input"
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            placeholder="Ask the AI assistant about revenue, branches, analytics, or maintenance..."
            rows={3}
          />
          <button className="primary-btn chat-send" type="submit" disabled={chatSending || !chatInput.trim()}>
            {chatSending ? 'SENDING...' : 'SEND'}
          </button>
        </form>
      </section>

      <section className="panel assistant-insights">
        <div className="panel-head">
          <div>
            <div className="panel-title">AI INSIGHTS</div>
            <div className="panel-subtitle mono">LATEST SIGNALS FROM THE BACKEND</div>
          </div>
        </div>

        <div className="insight-stack">
          {insights.map((item) => (
            <article key={item.title} className="insight-card">
              <div className="insight-tag">{item.title}</div>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

const DEFAULT_CHAT_MESSAGES = [
  {
    role: 'assistant',
    content: 'I’m online and ready. Ask me about revenue, branches, analytics, or maintenance.',
  },
];

function ChatModal({
  open,
  dashboard,
  messages,
  input,
  sending,
  error,
  onClose,
  onChangeInput,
  onSend,
  onPickPrompt,
}) {
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const topService = dashboard?.revenueBreakdown?.[0];
  const scopeLabel = dashboard?.scopeLabel || 'COMPANY PREVIEW';
  const liveRevenue = Number(dashboard?.revenueToday || 0);
  const branchCount = Array.isArray(dashboard?.branchLocations) ? dashboard.branchLocations.length : 0;

  useEffect(() => {
    if (!open) {
      return;
    }

    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [messages, open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || typeof document === 'undefined') {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  const handleBackdropClick = () => {
    onClose();
  };

  const handlePanelClick = (event) => {
    event.stopPropagation();
  };

  return (
    <div className="chat-modal-backdrop" role="presentation" onClick={handleBackdropClick}>
      <section
        className="chat-modal"
        role="dialog"
        aria-modal="true"
        aria-label="AI chat assistant"
        onClick={handlePanelClick}
      >
        <div className="chat-modal-header">
          <div>
            <div className="chat-modal-title">AI CHAT</div>
            <div className="chat-modal-subtitle mono">POWERED BY THE BACKEND MODEL</div>
          </div>
          <button type="button" className="chat-modal-close" onClick={onClose} aria-label="Close chat modal">
            ×
          </button>
        </div>

        <div className="chat-modal-context">
          <div className="chat-modal-context-item">
            <span className="mono">SCOPE</span>
            <strong>{scopeLabel}</strong>
          </div>
          <div className="chat-modal-context-item">
            <span className="mono">REVENUE</span>
            <strong>{formatRupiah(liveRevenue)}</strong>
          </div>
          <div className="chat-modal-context-item">
            <span className="mono">BRANCHES</span>
            <strong>{branchCount}</strong>
          </div>
          <div className="chat-modal-context-item">
            <span className="mono">TOP SERVICE</span>
            <strong>{topService?.serviceType || 'N/A'}</strong>
          </div>
        </div>

        <div className="chat-thread chat-thread-modal" aria-live="polite">
          {messages.map((message, index) => (
            <article key={`${message.role}-${index}`} className={`chat-message chat-message-${message.role}`}>
              <div className="chat-message-role mono">{message.role === 'assistant' ? 'YCW AI' : 'YOU'}</div>
              <div className="chat-message-bubble">{message.content}</div>
            </article>
          ))}
          <div ref={chatEndRef} />
        </div>

        {error ? <div className="chat-error mono">{error}</div> : null}

        <div className="assistant-chat-prompts assistant-chat-prompts-inline chat-modal-prompts">
          {CHAT_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="assistant-chat-chip"
              onClick={() => onPickPrompt(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>

        <form
          className="chat-form chat-form-modal"
          onSubmit={(event) => {
            event.preventDefault();
            onSend();
          }}
        >
          <textarea
            ref={inputRef}
            className="chat-input"
            value={input}
            onChange={(event) => onChangeInput(event.target.value)}
            placeholder="Ask about revenue, branches, analytics, or maintenance..."
            rows={4}
          />
          <div className="chat-form-actions">
            <div className="chat-form-status mono">{sending ? 'TYPING...' : 'READY'}</div>
            <button className="primary-btn chat-send" type="submit" disabled={sending || !input.trim()}>
              {sending ? 'SENDING...' : 'SEND'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function DashboardContent({ session, onLogout }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [alertVisible, setAlertVisible] = useState(true);
  const [selectedDensityIndex, setSelectedDensityIndex] = useState(8);
  const [aiInsight, setAiInsight] = useState(null);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [selectedClocksterId, setSelectedClocksterId] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(() => toInputDate(new Date()));
  const initialTimetableRange = getMonthRangeFromDate(new Date());
  const [timetableDateStart, setTimetableDateStart] = useState(initialTimetableRange.start);
  const [timetableDateEnd, setTimetableDateEnd] = useState(initialTimetableRange.end);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState(DEFAULT_CHAT_MESSAGES);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState('');
  const loadingRef = useRef(loading);
  const refreshingRef = useRef(refreshing);
  const loadDashboardRef = useRef(null);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    refreshingRef.current = refreshing;
  }, [refreshing]);

  const loadDashboard = async ({
    showSpinner = false,
    resetAlertVisible = false,
    storeId = selectedBranchId,
    attendanceLocationId = selectedClocksterId,
    attendanceDay = attendanceDate,
    timetableStartDate = timetableDateStart,
    timetableEndDate = timetableDateEnd,
  } = {}) => {
    if (showSpinner) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const result = await loadExecutiveDashboard({
        storeId,
        attendanceDate: attendanceDay,
        attendanceLocationId,
        timetableDateStart: timetableStartDate,
        timetableDateEnd: timetableEndDate,
      });
      const activeBranch = result.branchLocations?.find((branch) => String(branch.storeId ?? branch.id) === String(storeId)) || null;
      const resolvedScopeLabel = activeBranch?.name || (storeId === null || typeof storeId === 'undefined' ? 'COMPANY PREVIEW' : `BRANCH #${storeId}`);

      setDashboard({
        ...result,
        selectedStoreId: storeId,
        selectedBranch: activeBranch,
        scopeLabel: resolvedScopeLabel,
      });
      setLastUpdated(new Date());
      if (resetAlertVisible) {
        setAlertVisible(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardRef.current = loadDashboard;
  });

  useEffect(() => {
    loadDashboard({ resetAlertVisible: true });
  }, []);

  useEffect(() => {
    if (!dashboard) {
      return;
    }

    loadDashboard({
      showSpinner: true,
      resetAlertVisible: false,
      storeId: selectedBranchId,
      attendanceLocationId: selectedClocksterId,
      attendanceDay: attendanceDate,
    });
  }, [attendanceDate, selectedClocksterId]);

  const handleApplyTimetableRange = ({ dateStart, dateEnd }) => {
    setTimetableDateStart(dateStart);
    setTimetableDateEnd(dateEnd);

    loadDashboardRef.current?.({
      showSpinner: Boolean(dashboard),
      resetAlertVisible: true,
      storeId: selectedBranchId,
      attendanceLocationId: selectedClocksterId,
      attendanceDay: attendanceDate,
      timetableStartDate: dateStart,
      timetableEndDate: dateEnd,
    });
  };

  const handleSelectBranch = (branch) => {
    const nextBranchId = branch?.storeId ?? branch?.id ?? null;
    const nextClocksterId = branch?.clocksterId
      || branch?.raw?.clockster_id
      || branch?.raw?.clocksterId
      || branch?.raw?.clockster_location_id
      || branch?.raw?.clocksterLocationId
      || branch?.raw?.location_id
      || branch?.raw?.locationid
      || null;
    const normalizedBranchId = nextBranchId === null || typeof nextBranchId === 'undefined' || nextBranchId === ''
      ? null
      : Number(nextBranchId);

    if (normalizedBranchId && Number.isNaN(normalizedBranchId)) {
      return;
    }

    if (String(selectedBranchId ?? '') === String(normalizedBranchId ?? '')) {
      handleClearBranchFilter();
      return;
    }

    setSelectedBranchId(normalizedBranchId);
    setSelectedClocksterId(nextClocksterId ? String(nextClocksterId) : null);
    loadDashboardRef.current?.({
      showSpinner: Boolean(dashboard),
      resetAlertVisible: true,
      storeId: normalizedBranchId,
      attendanceLocationId: nextClocksterId ? String(nextClocksterId) : null,
      attendanceDay: attendanceDate,
    });
  };

  const handleClearBranchFilter = () => {
    setSelectedBranchId(null);
    setSelectedClocksterId(null);
    loadDashboardRef.current?.({
      showSpinner: Boolean(dashboard),
      resetAlertVisible: true,
      storeId: null,
      attendanceLocationId: null,
      attendanceDay: attendanceDate,
    });
  };

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'hidden') {
        return;
      }

      if (loadingRef.current || refreshingRef.current) {
        return;
      }

      loadDashboardRef.current?.({
        resetAlertVisible: false,
        storeId: selectedBranchId,
        attendanceLocationId: selectedClocksterId,
      });
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  const handleExportPdf = () => window.print();
  const selectedDensityBucket = getSelectedThroughputBucket(dashboard, selectedDensityIndex);
  const selectedDensity = selectedDensityBucket
    ? {
        label: selectedDensityBucket.time,
        realTime: selectedDensityBucket.realTime,
        historical: selectedDensityBucket.historical,
        delta: Number(selectedDensityBucket.realTime || 0) - Number(selectedDensityBucket.historical || 0),
      }
    : null;
  const handleGenerateInsight = async () => {
    if (!dashboard) {
      return;
    }

    setRefreshing(true);
    setError('');

    try {
      const result = await generateAiInsight({
        dashboard,
        selectedDensity,
      });

      setAiInsight(result.insight || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate AI insight');
    } finally {
      setRefreshing(false);
    }
  };
  const handleOpenChatModal = () => {
    setChatModalOpen(true);
  };

  const handleCloseChatModal = () => {
    setChatModalOpen(false);
  };

  const appendChatAssistantReply = (reply) => {
    setChatMessages((current) => [
      ...current,
      {
        role: 'assistant',
        content: reply,
      },
    ]);
  };

  const handleSendChat = async (rawText) => {
    const text = typeof rawText === 'string' ? rawText : chatInput;
    const trimmed = text.trim();

    if (!trimmed || chatSending) {
      return;
    }

    const nextMessages = [
      ...chatMessages,
      {
        role: 'user',
        content: trimmed,
      },
    ];

    setChatMessages(nextMessages);
    setChatInput('');
    setChatSending(true);
    setChatError('');

    try {
      const result = await generateAiChat({
        dashboard,
        messages: nextMessages,
      });

      appendChatAssistantReply(result.reply?.trim() || 'I’m here if you want a deeper operational breakdown.');
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Unable to reach the AI assistant.');
      appendChatAssistantReply('I could not reach the AI model just now. Please try again.');
    } finally {
      setChatSending(false);
    }
  };

  const handlePickChatPrompt = (prompt) => {
    setChatInput(prompt);
  };
  const operatorName = session?.staff?.name || session?.staff?.staffname || session?.staff?.fullName || session?.staff?.email || 'OPERATOR_UNIT_72';
  const topRightStatus = lastUpdated
    ? `ONLINE • ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'ONLINE';
  const operatorRole = session?.staff?.role
    ? `${String(session.staff.role).toUpperCase()} • ${topRightStatus}`
    : topRightStatus;

  if (loading && !dashboard) {
    return <LoadingState />;
  }

  return (
    <div className="ops-shell">
      <Sidebar />

      <main className="main-stage">
        <Header
          operatorName={operatorName}
          operatorRole={operatorRole}
          topRightStatus={topRightStatus}
          onExportPdf={handleExportPdf}
          onGenerateInsight={handleGenerateInsight}
          onLogout={onLogout}
          refreshing={refreshing}
        />

        {error ? <div className="error-banner">{error}</div> : null}

        <Routes>
          <Route path="/" element={<Navigate to="/summary" replace />} />
          <Route
            path="/summary"
            element={
              <SummaryView
                dashboard={dashboard}
                selectedBranch={dashboard?.selectedBranch || null}
                selectedBranchId={selectedBranchId}
                onSelectBranch={handleSelectBranch}
                onClearBranch={handleClearBranchFilter}
                attendanceDate={attendanceDate}
                onAttendanceDateChange={setAttendanceDate}
              />
            }
          />
          <Route path="/members" element={<MembersView dashboard={dashboard} />} />
          <Route path="/members/:memberId" element={<MembersView dashboard={dashboard} />} />
          <Route path="/compliments" element={<ComplimentsView dashboard={dashboard} />} />
          <Route path="/inventory" element={<InventoryView dashboard={dashboard} />} />
          <Route path="/stock-opname" element={<StockOpnameView dashboard={dashboard} />} />
          <Route path="/finance" element={<FinanceView dashboard={dashboard} />} />
          <Route path="/accounting" element={<AccountingView dashboard={dashboard} />} />
          <Route
            path="/attendance"
            element={
              <AttendanceView
                dashboard={dashboard}
                selectedBranch={dashboard?.selectedBranch || null}
                selectedBranchId={selectedBranchId}
                onSelectBranch={handleSelectBranch}
                onClearBranch={handleClearBranchFilter}
                attendanceDate={attendanceDate}
                onAttendanceDateChange={setAttendanceDate}
              />
            }
          />
          <Route
            path="/timetable"
            element={
              <TimetableView
                dashboard={dashboard}
                selectedBranch={dashboard?.selectedBranch || null}
                selectedBranchId={selectedBranchId}
                onSelectBranch={handleSelectBranch}
                onClearBranch={handleClearBranchFilter}
                attendanceDate={attendanceDate}
                onAttendanceDateChange={setAttendanceDate}
                timetableDateStart={timetableDateStart}
                timetableDateEnd={timetableDateEnd}
                onApplyTimetableRange={handleApplyTimetableRange}
              />
            }
          />
          <Route
            path="/analytics"
            element={
              <AnalyticsView
                dashboard={dashboard}
                onGenerateInsight={handleGenerateInsight}
                alertVisible={alertVisible}
                onDismissAlert={() => setAlertVisible(false)}
                selectedDensityIndex={selectedDensityIndex}
                onSelectDensityIndex={setSelectedDensityIndex}
                aiInsight={aiInsight}
              />
            }
          />
          <Route path="/ai-assistant" element={<AssistantView dashboard={dashboard} aiInsight={aiInsight} />} />
          <Route path="*" element={<Navigate to="/summary" replace />} />
        </Routes>

        <button className="floating-action" onClick={handleOpenChatModal} aria-label="Open AI chat">
          +
        </button>

        <ChatModal
          open={chatModalOpen}
          dashboard={dashboard}
          messages={chatMessages}
          input={chatInput}
          sending={chatSending}
          error={chatError}
          onClose={handleCloseChatModal}
          onChangeInput={setChatInput}
          onSend={handleSendChat}
          onPickPrompt={handlePickChatPrompt}
        />

        <MobileBottomNav />
      </main>
    </div>
  );
}

function AppRouter() {
  const [session, setSession] = useState(() => getStoredSession());
  const isAuthenticated = Boolean(session.token);

  const handleLoginSuccess = ({ token, staff }) => {
    setSession({ token, staff });
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(AUTH_STORAGE_KEYS.token);
      window.localStorage.removeItem(AUTH_STORAGE_KEYS.staff);
    }

    setSession({ token: '', staff: null });
  };

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? '/summary' : '/login'} replace />}
      />
      <Route
        path="/login"
        element={
          isAuthenticated
            ? <Navigate to="/summary" replace />
            : <LoginView onLoginSuccess={handleLoginSuccess} />
        }
      />
      <Route
        path="*"
        element={
          isAuthenticated
            ? <DashboardContent session={session} onLogout={handleLogout} />
            : <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}
