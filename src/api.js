const DEFAULT_API_BASE_URL = 'https://oxientsoft.my.id/api/v1';
const getApiBaseUrl = () => {
  const configured = import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL;
  return configured.replace(/\/$/, '');
};

const appendStoreId = (path, storeId) => {
  if (storeId === null || typeof storeId === 'undefined' || storeId === '') {
    return path;
  }

  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}storeId=${encodeURIComponent(String(storeId))}`;
};

const toYmd = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem('token');
};

const buildHeaders = ({ auth = false } = {}) => {
  const headers = {
    Accept: 'application/json',
  };

  if (auth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
};

const readErrorMessage = async (response) => {
  try {
    const text = await response.text();
    if (!text) {
      return `Request failed with status ${response.status}`;
    }

    try {
      const parsed = JSON.parse(text);
      return parsed.error || parsed.message || text;
    } catch {
      return text;
    }
  } catch {
    return `Request failed with status ${response.status}`;
  }
};

const requestJson = async (path, { auth = false, method = 'GET', body, headers: customHeaders } = {}) => {
  const headers = {
    ...buildHeaders({ auth }),
    ...(customHeaders || {}),
  };

  if (typeof body !== 'undefined') {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method,
    headers,
    body: typeof body === 'undefined' ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
};

const isMissingRouteError = (error) => {
  const message = error instanceof Error ? error.message : String(error || '');
  return message.includes('Route not found') || message.includes('404');
};

const getBranchStoreId = (branch) =>
  branch?.storeId ?? branch?.store_ID ?? branch?.id ?? null;

const parseDateOnly = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatTimetableDateLabel = (value) => {
  const date = parseDateOnly(value);

  if (!date) {
    return String(value || '').toUpperCase();
  }

  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).replace(',', '').toUpperCase();
};

const formatClocksterScheduleTime = (schedule = {}) => {
  if (schedule.type === 'leave' || schedule.leave_type) {
    return 'LEAVE';
  }

  const timeStart = typeof schedule.time_start === 'string' ? schedule.time_start.slice(0, 5) : '';
  const timeEnd = typeof schedule.time_end === 'string' ? schedule.time_end.slice(0, 5) : '';

  if (timeStart && timeEnd) {
    return `${timeStart} - ${timeEnd}`;
  }

  return String(schedule.title || schedule.type || 'SHIFT').toUpperCase();
};

const buildClocksterTimetableSections = (records = [], { dateStart, dateEnd } = {}) => {
  const startDate = parseDateOnly(dateStart);
  const endDate = parseDateOnly(dateEnd);

  if (!startDate || !endDate || endDate < startDate) {
    return [];
  }

  const dayMap = new Map();
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    const dayKey = toYmd(cursor);
    dayMap.set(dayKey, []);
    cursor.setDate(cursor.getDate() + 1);
  }

  records.forEach((record) => {
    const userName = getAttendanceUserName(record) || `User ${record?.user?.id || 'Unknown'}`;
    const dates = record?.dates && typeof record.dates === 'object' ? record.dates : {};

    Object.entries(dates).forEach(([dayKey, dayValue]) => {
      if (!dayMap.has(dayKey)) {
        return;
      }

      const schedule = dayValue?.schedule || {};
      const timeLabel = formatClocksterScheduleTime(schedule);
      const userStatus = schedule.type === 'leave'
        ? String(schedule.leave_type || 'LEAVE').replace(/_/g, ' ').toUpperCase()
        : String(schedule.title || schedule.type || 'WORK').toUpperCase();
      const attendanceCount = Array.isArray(dayValue?.attendance) ? dayValue.attendance.length : 0;
      const attendanceLabel = attendanceCount > 0
        ? `${attendanceCount} ATTENDANCE${attendanceCount > 1 ? 'S' : ''}`
        : 'NO ATTENDANCE';
      const dayItems = dayMap.get(dayKey);

      dayItems.push({
        no: dayItems.length + 1,
        time: timeLabel,
        text: `${userName} • ${userStatus} • ${attendanceLabel}`,
        sortMinutes: parseClockMinutes(schedule.time_start) ?? 24 * 60,
      });
    });
  });

  return [...dayMap.entries()].map(([dayKey, items]) => {
    const sortedItems = items
      .slice()
      .sort((a, b) => a.sortMinutes - b.sortMinutes || a.text.localeCompare(b.text))
      .map(({ sortMinutes, ...item }, index) => ({
        ...item,
        no: index + 1,
      }));

    return {
      key: dayKey,
      title: formatTimetableDateLabel(dayKey),
      items: sortedItems,
    };
  });
};

export const fetchClocksterTimetable = async ({ dateStart, dateEnd, locationId }) => {
  const records = [];
  let page = 1;
  let totalPages = 1;
  let proxyUrl = '';
  const requestParams = {
    date_start: dateStart,
    date_end: dateEnd,
    locations: locationId === null || typeof locationId === 'undefined' || locationId === '' ? null : String(locationId),
  };

  do {
    const query = new URLSearchParams({
      date_start: dateStart,
      date_end: dateEnd,
      page: String(page),
    });

    if (locationId !== null && typeof locationId !== 'undefined' && locationId !== '') {
      query.set('locations', String(locationId));
    }

    if (!proxyUrl) {
      proxyUrl = `${getApiBaseUrl()}/clockster/schedules?${query.toString()}`;
    }

    const result = await requestJson(`/clockster/schedules?${query.toString()}`);
    records.push(...(Array.isArray(result?.data) ? result.data : []));
    totalPages = Number(result?.meta?.last_page || result?.last_page || 1);
    page += 1;
  } while (page <= totalPages);

  const sections = buildClocksterTimetableSections(records, { dateStart, dateEnd });

  return {
    locationId: locationId === null || typeof locationId === 'undefined' ? null : String(locationId),
    dateStart,
    dateEnd,
    requestParams,
    proxyUrl,
    records,
    sections,
    proxyConfigured: true,
    proxySource: 'BACKEND',
  };
};

const fetchPaginatedInventoryItems = async ({ limit = 100 } = {}) => {
  const items = [];
  let page = 1;
  let totalPages = 1;

  do {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });

    const result = await requestJson(`/inventory?${query.toString()}`);
    items.push(...(Array.isArray(result?.data) ? result.data : []));

    const pagination = result?.pagination || {};
    totalPages = Number(pagination.pages || 1);
    page += 1;
  } while (page <= totalPages);

  return items;
};

export const loadInventoryCatalog = async ({ limit = 100 } = {}) => {
  const [items, summaryResult, lowStockResult] = await Promise.all([
    fetchPaginatedInventoryItems({ limit }),
    requestJson('/inventory/summary').catch(() => null),
    requestJson('/inventory/low-stock').catch(() => null),
  ]);

  return {
    items,
    summary: summaryResult?.data || {},
    lowStock: Array.isArray(lowStockResult?.data) ? lowStockResult.data : [],
    proxyConfigured: true,
    proxySource: 'BACKEND',
    requestParams: {
      limit,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    },
  };
};

export const createInventoryItem = async (payload) => {
  const result = await requestJson('/inventory', {
    method: 'POST',
    body: payload,
  });

  return result.data;
};

export const updateInventoryStockCount = async ({ itemId, systemQuantity, countedQuantity, branchName }) => {
  const change = Number(countedQuantity || 0) - Number(systemQuantity || 0);
  const result = await requestJson(`/inventory/${encodeURIComponent(String(itemId))}/adjust-stock`, {
    method: 'POST',
    body: {
      change,
      reason: `Stock opname${branchName ? ` - ${branchName}` : ''}: counted ${countedQuantity}, system ${systemQuantity}`,
    },
  });

  return result.data;
};

export const loadAccountingSystem = async () => {
  const [coaResult, journalsResult] = await Promise.all([
    requestJson('/accounting/coa'),
    requestJson('/accounting/journals'),
  ]);

  return {
    accounts: Array.isArray(coaResult?.data) ? coaResult.data : [],
    journals: Array.isArray(journalsResult?.data) ? journalsResult.data : [],
  };
};

export const createAccountingAccount = async (payload) => {
  const result = await requestJson('/accounting/coa', {
    method: 'POST',
    body: payload,
  });

  return result.data;
};

export const createAccountingJournal = async (payload) => {
  const result = await requestJson('/accounting/journals', {
    method: 'POST',
    body: payload,
  });

  return result.data;
};

export const loadItemMaster = async ({ search, category } = {}) => {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (category) params.set('category', category);
  const query = params.toString();
  const result = await requestJson(`/items${query ? `?${query}` : ''}`);

  return Array.isArray(result?.data) ? result.data : [];
};

export const createItemMaster = async (payload) => {
  const result = await requestJson('/items', {
    method: 'POST',
    body: payload,
  });

  return result.data;
};

export const loadBranchStock = async ({ branchId, itemId } = {}) => {
  const params = new URLSearchParams();
  if (branchId !== undefined && branchId !== null && branchId !== '') params.set('branchId', branchId);
  if (itemId !== undefined && itemId !== null && itemId !== '') params.set('itemId', itemId);
  const query = params.toString();
  const result = await requestJson(`/branch-stock${query ? `?${query}` : ''}`);

  return Array.isArray(result?.data) ? result.data : [];
};

export const addBranchStock = async (payload) => {
  const result = await requestJson('/branch-stock', {
    method: 'POST',
    body: payload,
  });

  return result.data;
};

export const transferBranchStock = async (payload) => {
  const result = await requestJson('/branch-stock/transfer', {
    method: 'POST',
    body: payload,
  });

  return result.data;
};

export const loadStockTransfers = async ({ branchId } = {}) => {
  const params = new URLSearchParams();
  if (branchId !== undefined && branchId !== null && branchId !== '') params.set('branchId', branchId);
  const query = params.toString();
  const result = await requestJson(`/branch-stock/transfers${query ? `?${query}` : ''}`);

  return Array.isArray(result?.data) ? result.data : [];
};

export const loadSuppliers = async ({ search, isActive } = {}) => {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (isActive !== undefined) params.set('isActive', isActive);
  const query = params.toString();
  const result = await requestJson(`/suppliers${query ? `?${query}` : ''}`);

  return Array.isArray(result?.data) ? result.data : [];
};

export const createSupplier = async (payload) => {
  const result = await requestJson('/suppliers', {
    method: 'POST',
    body: payload,
  });

  return result.data;
};

export const loadPurchaseOrders = async ({ status, supplierId, branchId } = {}) => {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (supplierId !== undefined && supplierId !== null && supplierId !== '') params.set('supplierId', supplierId);
  if (branchId !== undefined && branchId !== null && branchId !== '') params.set('branchId', branchId);
  const query = params.toString();
  const result = await requestJson(`/purchase-orders${query ? `?${query}` : ''}`);

  return Array.isArray(result?.data) ? result.data : [];
};

export const createPurchaseOrder = async (payload) => {
  const result = await requestJson('/purchase-orders', {
    method: 'POST',
    body: payload,
  });

  return result.data;
};

export const receivePurchaseOrder = async (id) => {
  const result = await requestJson(`/purchase-orders/${id}/receive`, {
    method: 'POST',
  });

  return result.data;
};

export const cancelPurchaseOrder = async (id) => {
  const result = await requestJson(`/purchase-orders/${id}/cancel`, {
    method: 'POST',
  });

  return result.data;
};

export const loadSalaryScales = async () => {
  const result = await requestJson('/hr/salary-scales');
  return Array.isArray(result?.data) ? result.data : [];
};

export const createSalaryScale = async (payload) => {
  const result = await requestJson('/hr/salary-scales', {
    method: 'POST',
    body: payload,
  });

  return result.data;
};

export const loadSalaryAssignments = async () => {
  const result = await requestJson('/hr/salary-assignments');
  return Array.isArray(result?.data) ? result.data : [];
};

export const loadClocksterStaff = async () => {
  const staff = [];
  let page = 1;
  let totalPages = 1;

  do {
    const result = await requestJson(`/clockster/users?page=${page}`);
    staff.push(...(Array.isArray(result?.data) ? result.data : []));
    totalPages = Number(result?.meta?.last_page || 1);
    page += 1;
  } while (page <= totalPages);

  return staff;
};

export const assignStaffSalary = async (staffId, salaryScaleId) => {
  const result = await requestJson(`/hr/staff/${encodeURIComponent(String(staffId))}/salary`, {
    method: 'POST',
    body: { salaryScaleId },
  });

  return result.data;
};

export const loadOutletAssets = async ({ outlet } = {}) => {
  const params = new URLSearchParams();
  if (outlet) params.set('outlet', outlet);
  const query = params.toString();
  const result = await requestJson(`/outlet-assets${query ? `?${query}` : ''}`);

  return Array.isArray(result?.data) ? result.data : [];
};

export const loadOutletAssetOutlets = async () => {
  const result = await requestJson('/outlet-assets/outlets');
  return Array.isArray(result?.data) ? result.data : [];
};

export const loadPaymentSettings = async () => {
  const result = await requestJson('/payment-settings');
  return Array.isArray(result?.data) ? result.data : [];
};

export const savePaymentSettings = async (provider, payload) => {
  const result = await requestJson(`/payment-settings/${encodeURIComponent(provider)}`, {
    method: 'PUT',
    body: payload,
  });

  return result.data;
};

export const loadLoyaltyVoucherServices = async () => {
  const result = await requestJson('/loyalty-vouchers/services');
  return Array.isArray(result?.data) ? result.data : [];
};

export const loadLoyaltyVouchers = async () => {
  const result = await requestJson('/loyalty-vouchers');
  return Array.isArray(result?.data) ? result.data : [];
};

export const createLoyaltyVoucher = async (payload) => {
  const result = await requestJson('/loyalty-vouchers', {
    method: 'POST',
    body: payload,
  });

  return result.data;
};

export const redeemLoyaltyVoucher = async (id) => {
  const result = await requestJson(`/loyalty-vouchers/${encodeURIComponent(String(id))}/redeem`, {
    method: 'POST',
  });

  return result.data;
};

export const loadDailyTargets = async ({ branchId } = {}) => {
  const query = branchId !== undefined && branchId !== null && branchId !== '' ? `?branchId=${encodeURIComponent(String(branchId))}` : '';
  const result = await requestJson(`/daily-targets${query}`);
  return Array.isArray(result?.data) ? result.data : [];
};

export const saveDailyTarget = async (id, targetCount) => {
  const result = await requestJson(`/daily-targets/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    body: { targetCount },
  });

  return result.data;
};

export const loadMaintenanceAssets = async () => {
  const result = await requestJson('/maintenance/assets');
  return Array.isArray(result?.data) ? result.data : [];
};

export const loadAttendanceReport = async ({ branch, startDate, endDate, limit = 200 } = {}) => {
  const locationId = String(
    branch?.clocksterId
      || branch?.raw?.clockster_id
      || branch?.raw?.clocksterId
      || branch?.raw?.clockster_location_id
      || branch?.raw?.clocksterLocationId
      || branch?.raw?.location_id
      || branch?.raw?.locationid
      || '17526'
  );

  const records = [];
  let page = 1;
  let totalPages = 1;

  do {
    const query = new URLSearchParams({
      date_start: startDate,
      date_end: endDate,
      locations: locationId,
      page: String(page),
      limit: String(limit),
    });

    const result = await requestJson(`/attendance?${query.toString()}`);
    records.push(...(Array.isArray(result?.data) ? result.data : []));
    totalPages = Number(result?.meta?.last_page || result?.last_page || 1);
    page += 1;
  } while (page <= totalPages);

  return records;
};

export const loginStaff = async ({ identifier, email, password }) => {
  const loginIdentifier = String(identifier || email || '').trim();
  const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ identifier: loginIdentifier, email: loginIdentifier, password }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
};

const buildAiInsightPayload = (dashboard = {}, selectedDensity = {}) => {
  const density = selectedDensity || {};

  return {
    dashboard: {
      revenueToday: dashboard.revenueToday || 0,
      revenueMonth: dashboard.revenueMonth || 0,
      activeServices: dashboard.activeServices || 0,
      completedToday: dashboard.completedToday || 0,
      monthlyExpenses: dashboard.monthlyExpenses || 0,
      profitMargin: dashboard.profitMargin || 0,
      weeklyEstimate: dashboard.weeklyEstimate || 0,
      confidenceLabel: dashboard.confidenceLabel || 'MEDIUM',
      equipmentIssues: dashboard.equipmentIssues || 0,
      revenueBreakdown: dashboard.revenueBreakdown || [],
      selectedBranch: dashboard.selectedBranch || null,
      scopeLabel: dashboard.scopeLabel || 'COMPANY PREVIEW',
    },
    selectedDensity: {
      label: density.label || density.time || 'Selected slot',
      realTime: density.realTime || 0,
      historical: density.historical || 0,
      delta: density.delta || 0,
    },
  };
};

export const generateAiInsight = async ({ dashboard, selectedDensity }) => {
  return requestJson('/ai/insight', {
    auth: true,
    method: 'POST',
    body: buildAiInsightPayload(dashboard, selectedDensity),
  });
};

const buildAiChatPayload = (dashboard = {}, messages = []) => {
  const safeMessages = Array.isArray(messages)
    ? messages
        .filter((message) => message && typeof message.content === 'string' && ['user', 'assistant'].includes(message.role))
        .slice(-12)
        .map((message) => ({
          role: message.role,
          content: message.content.slice(0, 2000),
        }))
    : [];

  return {
    dashboard: {
      revenueToday: dashboard.revenueToday || 0,
      revenueMonth: dashboard.revenueMonth || 0,
      activeServices: dashboard.activeServices || 0,
      completedToday: dashboard.completedToday || 0,
      monthlyExpenses: dashboard.monthlyExpenses || 0,
      profitMargin: dashboard.profitMargin || 0,
      weeklyEstimate: dashboard.weeklyEstimate || 0,
      confidenceLabel: dashboard.confidenceLabel || 'MEDIUM',
      equipmentIssues: dashboard.equipmentIssues || 0,
      branchLocations: dashboard.branchLocations || [],
      revenueBreakdown: dashboard.revenueBreakdown || [],
      selectedBranch: dashboard.selectedBranch || null,
      scopeLabel: dashboard.scopeLabel || 'COMPANY PREVIEW',
    },
    messages: safeMessages,
  };
};

const formatCurrencyId = (value) => {
  return `Rp${Number(value || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;
};

const normalizeLookupText = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const LOOKUP_STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'be',
  'branch',
  'branches',
  'can',
  'for',
  'how',
  'i',
  'improve',
  'in',
  'is',
  'me',
  'of',
  'on',
  'open',
  'or',
  'please',
  'should',
  'show',
  'something',
  'the',
  'to',
  'today',
  'what',
  'why',
]);

const tokenizeLookupText = (value) => {
  return normalizeLookupText(value)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token && !LOOKUP_STOPWORDS.has(token));
};

const branchQueryMatches = (branchName, query) => {
  const branchTokens = tokenizeLookupText(branchName);
  const queryTokens = tokenizeLookupText(query);

  if (!branchTokens.length || !queryTokens.length) {
    return false;
  }

  const overlap = branchTokens.filter((token) => queryTokens.includes(token));

  if (overlap.length > 0) {
    return true;
  }

  return branchTokens.some((token) => queryTokens.some((queryToken) => queryToken.includes(token) || token.includes(queryToken)));
};

const buildAiChatFallbackReply = (dashboard = {}, messages = []) => {
  const safeMessages = Array.isArray(messages)
    ? messages.filter((message) => message && typeof message.content === 'string')
    : [];
  const lastUserMessage = [...safeMessages].reverse().find((message) => message.role === 'user');
  const revenueToday = formatCurrencyId(dashboard?.revenueToday || 0);
  const branchLocations = Array.isArray(dashboard?.branchLocations) ? dashboard.branchLocations : [];
  const branchCount = branchLocations.length;
  const scopeLabel = dashboard?.scopeLabel || 'COMPANY PREVIEW';
  const userLookup = lastUserMessage?.content || '';
  const matchedBranch = branchLocations.find((branch) => {
    const branchName = branch?.name || branch?.raw?.name;
    return branchName && userLookup && branchQueryMatches(branchName, userLookup);
  });

  if (!lastUserMessage) {
    return `I’m ready. Ask me about revenue, branches, analytics, or maintenance. Current scope: ${scopeLabel}. What would you like to check first?`;
  }

  if (matchedBranch) {
    const branchName = matchedBranch?.name || matchedBranch?.raw?.name || 'that branch';
    return `I can see ${branchName} in the branch list, but this dashboard payload does not include revenue for that branch yet. Current company revenue is ${revenueToday}. Current scope: ${scopeLabel}. Would you like me to open the timetable or branch summary next?`;
  }

  return `I heard: "${lastUserMessage.content.slice(0, 180)}". Current daily revenue is ${revenueToday}, and I can see ${branchCount} branch location${branchCount === 1 ? '' : 's'} loaded right now. Current scope: ${scopeLabel}. What should I check next?`;
};

export const generateAiChat = async ({ dashboard, messages }) => {
  const payload = buildAiChatPayload(dashboard, messages);

  try {
    return await requestJson('/ai/chat', {
      auth: true,
      method: 'POST',
      body: payload,
    });
  } catch (error) {
    console.warn('AI chat fallback triggered:', error);
    return {
      success: true,
      reply: buildAiChatFallbackReply(dashboard, messages),
      fallback: true,
    };
  }
};

export const loadBranchLocations = async () => {
  try {
    const result = await requestJson('/stores/branches');
    return result.data || [];
  } catch (error) {
    if (isMissingRouteError(error)) {
      return [];
    }

    throw error;
  }
};

const fetchPagedTransactions = async ({ startDate, endDate, pageSize = 100, storeId = null, search = '' }) => {
  const transactions = [];
  let page = 1;
  let totalPages = 1;

  do {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(pageSize),
      startDate,
      endDate,
    });

    if (storeId !== null && typeof storeId !== 'undefined' && storeId !== '') {
      query.set('storeId', String(storeId));
    }

    if (search && String(search).trim()) {
      query.set('search', String(search).trim());
    }

    const result = await requestJson(`/sales/history?${query.toString()}`);
    transactions.push(...(result.data || []));
    totalPages = result.pagination?.totalPages || 1;
    page += 1;
  } while (page <= totalPages);

  return transactions;
};

export const fetchTransactionHistory = async ({ startDate, endDate, pageSize = 100, storeId = null, search = '' }) => {
  return fetchPagedTransactions({ startDate, endDate, pageSize, storeId, search });
};

export const fetchCompliments = async ({
  search = '',
  status = 'active',
  page = 1,
  limit = 12,
  sortBy = 'eligibilityScore',
  sortOrder = 'desc',
} = {}) => {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    status,
    sortBy,
    sortOrder,
  });

  if (search && String(search).trim()) {
    query.set('search', String(search).trim());
  }

  return requestJson(`/customers/compliments?${query.toString()}`);
};

export const createComplimentVoucher = async ({
  rewardText = 'COMPLIMENTARY WASH',
  discountValue = 100,
  discountType = 'percent',
  status = 'active',
  expiresInDays = 30,
} = {}) => {
  return requestJson('/customers/compliments', {
    method: 'POST',
    body: {
      rewardText,
      discountValue,
      discountType,
      status,
      expiresInDays,
    },
  });
};

export const loadMembers = async ({ search = '', tier = 'all', status = 'all', page = 1, limit = 20 } = {}) => {
  const query = new URLSearchParams({ page: String(page), limit: String(limit), tier, status });
  if (search && search.trim()) query.set('search', search.trim());

  return requestJson(`/customers/members?${query.toString()}`);
};

export const loadMemberDetail = async (id) => {
  return requestJson(`/customers/members/${encodeURIComponent(String(id))}`);
};

export const createMember = async (payload) => {
  return requestJson('/customers', {
    method: 'POST',
    body: payload,
  });
};

export const recordLoyaltyTransaction = async (id, payload) => {
  return requestJson(`/customers/${encodeURIComponent(String(id))}/loyalty`, {
    method: 'POST',
    body: payload,
  });
};

const hourBuckets = [
  { label: '08:00', hour: 8 },
  { label: '10:00', hour: 10 },
  { label: '12:00', hour: 12 },
  { label: '14:00', hour: 14 },
  { label: '16:00', hour: 16 },
];

const countTransactionsByHour = (transactions) => {
  return hourBuckets.map(({ label, hour }) => {
    const count = transactions.reduce((sum, transaction) => {
      const current = new Date(transaction.datetransact);
      if (Number.isNaN(current.getTime())) {
        return sum;
      }

      return current.getHours() === hour ? sum + 1 : sum;
    }, 0);

    return { label, count };
  });
};

const buildHistoricalAverages = (transactions) => {
  const dayMap = new Map();
  const todayKey = toYmd(new Date());

  transactions.forEach((transaction) => {
    const current = new Date(transaction.datetransact);
    if (Number.isNaN(current.getTime())) {
      return;
    }

    const dayKey = toYmd(current);
    if (dayKey === todayKey) {
      return;
    }

    if (!dayMap.has(dayKey)) {
      dayMap.set(dayKey, []);
    }

    dayMap.get(dayKey).push(transaction);
  });

  const dayCount = Math.max(dayMap.size, 1);

  return hourBuckets.map(({ label, hour }) => {
    const total = [...dayMap.values()].reduce((sum, dayTransactions) => {
      return sum + dayTransactions.filter((transaction) => {
        const current = new Date(transaction.datetransact);
        return !Number.isNaN(current.getTime()) && current.getHours() === hour;
      }).length;
    }, 0);

    return { label, count: Math.round(total / dayCount) };
  });
};

const normalizePersonName = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const getAttendanceUserName = (record) => {
  const first = String(record?.user?.first_name || '').trim();
  const last = String(record?.user?.last_name || '').trim();
  return `${first} ${last}`.trim();
};

const parseClockMinutes = (value) => {
  const current = new Date(value);
  if (Number.isNaN(current.getTime())) {
    return null;
  }

  return current.getHours() * 60 + current.getMinutes();
};

const buildBranchScheduleSummary = (scheduleSections = []) => {
  return scheduleSections.map((section) => ({
    title: section.title,
    items: Array.isArray(section.items)
      ? section.items.slice(0, 4).map((item) => ({
          time: item.time,
          text: item.text,
          no: item.no,
        }))
      : [],
  }));
};

const buildRevenueBreakdown = (transactions) => {
  const serviceMap = new Map();

  transactions.forEach((transaction) => {
    const items = Array.isArray(transaction.items) ? transaction.items : [];

    items.forEach((item) => {
      const serviceType = String(item.itemname || item.name || item.serviceType || 'Unknown Service').trim() || 'Unknown Service';
      const quantity = Number(item.qty || 1);
      const unitPrice = Number(item.price || item.amount || 0);
      const revenue = unitPrice * quantity;
      const current = serviceMap.get(serviceType) || { serviceType, revenue: 0, count: 0 };

      current.revenue += revenue;
      current.count += quantity;
      serviceMap.set(serviceType, current);
    });
  });

  const totalRevenue = [...serviceMap.values()].reduce((sum, item) => sum + item.revenue, 0);

  return [...serviceMap.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .map((item) => ({
      serviceType: item.serviceType,
      revenue: item.revenue,
      count: item.count,
      percentage: totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0,
    }));
};

const loadExecutiveDashboardOnce = async ({
  storeId = null,
  attendanceDate = null,
  attendanceLocationId = null,
  timetableDateStart = null,
  timetableDateEnd = null,
} = {}) => {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const attendanceBaseDate = attendanceDate ? new Date(`${attendanceDate}T00:00:00`) : today;
  const timetableMonthStart = new Date(attendanceBaseDate.getFullYear(), attendanceBaseDate.getMonth(), 1);
  const timetableMonthEnd = new Date(attendanceBaseDate.getFullYear(), attendanceBaseDate.getMonth() + 1, 0);
  const resolvedTimetableStart = timetableDateStart ? new Date(`${timetableDateStart}T00:00:00`) : timetableMonthStart;
  const resolvedTimetableEnd = timetableDateEnd ? new Date(`${timetableDateEnd}T00:00:00`) : timetableMonthEnd;
  const lastSevenDaysStart = new Date(today);
  lastSevenDaysStart.setDate(today.getDate() - 6);

  const settledResults = await Promise.allSettled([
    requestJson(appendStoreId('/dashboard/overview', storeId)),
    requestJson(appendStoreId('/sales/stats', storeId)),
    requestJson(appendStoreId('/dashboard/revenue?period=week', storeId)),
    requestJson(appendStoreId(`/expenses?startDate=${toYmd(monthStart)}&endDate=${toYmd(today)}&limit=1`, storeId), { auth: true }),
    fetchPagedTransactions({
      startDate: toYmd(today),
      endDate: toYmd(today),
      storeId,
    }),
    fetchPagedTransactions({
      startDate: toYmd(lastSevenDaysStart),
      endDate: toYmd(today),
      storeId,
    }),
    fetchClocksterTimetable({
      dateStart: toYmd(resolvedTimetableStart),
      dateEnd: toYmd(resolvedTimetableEnd),
      locationId: attendanceLocationId || '17526',
    }),
    loadBranchLocations(),
  ]);

  const [
    overviewResult,
    statsResult,
    revenueResult,
    expensesResult,
    todayTransactionsResult,
    historyTransactionsResult,
    timetableResult,
    branchLocationsResult,
  ] = settledResults;

  const missingRouteFailure = settledResults.some(
    (result) => result.status === 'rejected' && isMissingRouteError(result.reason)
  );

  const overview = overviewResult.status === 'fulfilled'
    ? overviewResult.value
    : { data: { status: { active: 0, pending: 0, completed: 0 }, revenue: { today: 0, month: 0 }, resources: { customers: 0, staff: 0, equipment: { operational: 0, issues: 0 } } } };

  const stats = statsResult.status === 'fulfilled'
    ? statsResult.value
    : { data: { today: { total: 0, count: 0, active: 0, completed: 0 }, month: { total: 0, count: 0, active: 0, completed: 0 } } };

  const revenue = revenueResult.status === 'fulfilled'
    ? revenueResult.value
    : { totalRevenue: 0, totalServices: 0, averageServiceValue: 0, revenueData: [], serviceTypeBreakdown: [] };

  const expenses = expensesResult.status === 'fulfilled'
    ? expensesResult.value
    : { summary: { totalAmount: 0, totalItems: 0 } };

  const todayTransactions = todayTransactionsResult.status === 'fulfilled'
    ? todayTransactionsResult.value
    : [];

  const historyTransactions = historyTransactionsResult.status === 'fulfilled'
    ? historyTransactionsResult.value
    : [];

  const branchLocations = branchLocationsResult.status === 'fulfilled'
    ? branchLocationsResult.value
    : [];
  const clocksterTimetable = timetableResult.status === 'fulfilled'
    && (timetableResult.value?.records?.length || timetableResult.value?.sections?.length)
    ? timetableResult.value
    : null;

  const revenueToday = Number(stats.data?.today?.total || 0);
  const monthRevenue = Number(stats.data?.month?.total || 0);
  const monthVehicleCount = Number(stats.data?.month?.count || 0);
  const vehicleTarget = 1500;
  const quotaReached = vehicleTarget > 0 ? Math.min(Math.round((monthVehicleCount / vehicleTarget) * 100), 100) : 0;
  const monthlyExpenses = Number(expenses.summary?.totalAmount || 0);
  const profitMargin = monthRevenue > 0 ? ((monthRevenue - monthlyExpenses) / monthRevenue) * 100 : 0;

  const weeklyEstimate = Math.round((Number(revenueToday > 0 ? revenueToday * 7 : monthRevenue) * 1.15));
  const confidenceValue = Math.min(99, 80 + Math.max(Number(stats.data?.month?.count || revenue.totalServices || 0), 12));
  const confidenceLabel = confidenceValue >= 85 ? 'HIGH' : confidenceValue >= 70 ? 'MEDIUM' : 'LOW';

  const realTimeBars = countTransactionsByHour(todayTransactions);
  const historicalBars = buildHistoricalAverages(historyTransactions);
  const branchRevenueBreakdown = buildRevenueBreakdown(historyTransactions);

  const topService = branchRevenueBreakdown?.[0] || revenue.serviceTypeBreakdown?.[0];
  const equipmentIssues = Number(overview.data?.resources?.equipment?.issues || 0);
  const selectedBranch = storeId === null || typeof storeId === 'undefined'
    ? null
    : branchLocations.find((branch) => String(getBranchStoreId(branch)) === String(storeId)) || null;
  const scopeLabel = selectedBranch?.name || (storeId === null || typeof storeId === 'undefined' ? 'COMPANY PREVIEW' : `BRANCH #${storeId}`);

  const resolvedAttendanceLocationId = String(
    attendanceLocationId
      || selectedBranch?.clocksterId
      || selectedBranch?.raw?.clockster_id
      || selectedBranch?.raw?.clocksterId
      || selectedBranch?.raw?.clockster_location_id
      || selectedBranch?.raw?.clocksterLocationId
      || selectedBranch?.raw?.location_id
      || selectedBranch?.raw?.locationid
      || '17526'
  );
  const attendanceDay = typeof attendanceDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(attendanceDate)
    ? attendanceDate
    : toYmd(today);

  let attendanceResult = { data: [] };
  try {
    const attendanceParams = new URLSearchParams({
      date_start: attendanceDay,
      date_end: attendanceDay,
      locations: resolvedAttendanceLocationId,
      page: '1',
    });

    attendanceResult = await requestJson(`/attendance?${attendanceParams.toString()}`);
  } catch (error) {
    console.warn('Error fetching Clockster attendance:', error);
  }

  const attendanceRecords = Array.isArray(attendanceResult?.data)
    ? attendanceResult.data
    : [];
  const normalizedAttendanceRecords = attendanceRecords
    .slice()
    .sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
  const attendanceSummary = {
    total: normalizedAttendanceRecords.length,
    clockIn: normalizedAttendanceRecords.filter((record) => Number(record.status) === 1).length,
    clockOut: normalizedAttendanceRecords.filter((record) => Number(record.status) === 0).length,
    breakClockIn: normalizedAttendanceRecords.filter((record) => Number(record.status) === 2).length,
  };
  const insights = [
    {
      title: 'Optimization Opportunity',
      body: topService
        ? `Increase focus on ${topService.serviceType} packages to capture ${topService.percentage?.toFixed?.(1) || 0}% of current revenue mix and improve daily throughput.`
        : 'Review chemical usage and cross-sell bundles to improve peak-hour conversion.',
    },
    {
      title: 'Maintenance Alert',
      body: equipmentIssues > 0
        ? `${equipmentIssues} equipment issue${equipmentIssues > 1 ? 's are' : ' is'} currently flagged in the backend dashboard. Prioritize the oldest open case before the next peak cycle.`
        : 'No critical equipment anomalies detected in the latest backend sweep.',
    },
  ];

  return {
    revenueToday,
    monthVehicleCount,
    vehicleTarget,
    quotaReached,
    profitMargin,
    profitTarget: 35,
    profitDelta: profitMargin - 35,
    weeklyEstimate,
    confidenceLabel,
    confidenceValue,
    revenueMonth: monthRevenue,
    monthlyExpenses,
    staffOnDuty: Number(overview.data?.resources?.staff || 0),
    activeServices: Number(overview.data?.status?.active || 0),
    completedToday: Number(stats.data?.today?.completed || 0),
    equipmentIssues,
    insights,
    throughputBars: realTimeBars.map((bar, index) => ({
      time: bar.label,
      realTime: bar.count,
      historical: historicalBars[index]?.count ?? 0,
    })),
    branchLocations,
    selectedBranch,
    selectedStoreId: storeId,
    scopeLabel,
    attendanceRecords: normalizedAttendanceRecords,
    attendanceSummary,
    clocksterTimetable,
    revenueBreakdown: branchRevenueBreakdown.length ? branchRevenueBreakdown : (revenue.serviceTypeBreakdown || []),
    revenueAnalytics: revenue,
    __missingRouteFailure: missingRouteFailure,
  };
};

export const loadExecutiveDashboard = async ({
  storeId = null,
  attendanceDate = null,
  attendanceLocationId = null,
  timetableDateStart = null,
  timetableDateEnd = null,
} = {}) => {
  const scopedDashboard = await loadExecutiveDashboardOnce({
    storeId,
    attendanceDate,
    attendanceLocationId,
    timetableDateStart,
    timetableDateEnd,
  });

  if (storeId === null || typeof storeId === 'undefined') {
    const { __missingRouteFailure, ...cleanDashboard } = scopedDashboard;
    return cleanDashboard;
  }

  if (!scopedDashboard.__missingRouteFailure) {
    const { __missingRouteFailure, ...cleanDashboard } = scopedDashboard;
    return cleanDashboard;
  }

  const companyDashboard = await loadExecutiveDashboardOnce({
    storeId: null,
    attendanceDate,
    attendanceLocationId,
    timetableDateStart,
    timetableDateEnd,
  });
  const { __missingRouteFailure, ...cleanCompanyDashboard } = companyDashboard;
  return cleanCompanyDashboard;
};
