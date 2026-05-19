// ─── Report API Service — All Endpoints ──────────────────────────────────────
// Every known API endpoint is wired here.
// Mock fallback is active where backend endpoint not yet built.
// To switch to real data: backend just needs to return the correct JSON shape.

import type {
    ReportTypeOption,
    ShareholderFilterCounts,
    Security,
    ReportPricing,
    ReportOrderRequest,
    OwnersResponse,
    ReportMetadata,
    FilterKey,
} from './reportApiTypes';
import type { SummaryRow } from '@/pages/ReportView/types';
import { SUMMARY_ROWS, SHARES_INFO, getMockOwners } from '@/pages/ReportView/reportData';

const BASE = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');

// ─── Generic helpers ──────────────────────────────────────────────────────────

async function get<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`[API ${res.status}] GET ${path}`);
    return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`[API ${res.status}] POST ${path}`);
    return res.json() as Promise<T>;
}

function qs(params: Record<string, string | number | boolean | string[] | undefined>): string {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === null || v === '') continue;
        if (Array.isArray(v)) v.forEach(i => p.append(k, String(i)));
        else p.set(k, String(v));
    }
    const s = p.toString();
    return s ? `?${s}` : '';
}

// ══════════════════════════════════════════════════════════════════════════════
// ✅ EXISTING ENDPOINTS (already built by backend dev)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/reports/reporttypes
 * Returns all report type options for radio buttons.
 * Response: [{ report_type_id, report_name, report_group }]
 */
export function fetchReportTypes(): Promise<ReportTypeOption[]> {
    return get<ReportTypeOption[]>('/reports/reporttypes');
}

/**
 * GET /api/reports/shareholder/{reportId}/filters
 * Returns filter chip counts + filteredOwners + filteredUnits.
 * Query: directCount, nomineeCount, companyCount, financialCount, householdCount (booleans)
 */
export function fetchFilterCounts(
    reportId: number,
    activeFilters: FilterKey[],
): Promise<ShareholderFilterCounts> {
    const none = activeFilters.length === 0;
    return get<ShareholderFilterCounts>(
        `/reports/shareholder/${reportId}/filters` +
        qs({
            directCount:    none || activeFilters.includes('directly'),
            nomineeCount:   none || activeFilters.includes('nominee'),
            companyCount:   none || activeFilters.includes('companies'),
            financialCount: none || activeFilters.includes('financial'),
            householdCount: none || activeFilters.includes('households'),
        })
    );
}

/**
 * GET /api/data/securities/issuer/{issuerId}
 * Returns all share classes for an issuer.
 * Response: [{ securityId, securityName, securityShortName, securityType, clauseFlag, isActive }]
 */
export function fetchSecuritiesByIssuer(issuerId: number): Promise<Security[]> {
    return get<Security[]>(`/data/securities/issuer/${issuerId}`);
}

/**
 * GET /api/data/security/{securityId}
 * Returns a single security/share class by ID.
 */
export function fetchSecurity(securityId: number): Promise<Security> {
    return get<Security>(`/data/security/${securityId}`);
}

/**
 * GET /api/reports/pricing/{reportOrderId}
 * Returns price for a report order (used in download modal).
 * Response: { reportOrderId, price }
 */
export function fetchReportPricing(reportOrderId: number): Promise<ReportPricing> {
    return get<ReportPricing>(`/reports/pricing/${reportOrderId}`);
}

/**
 * POST /api/reports/order/
 * Places a report order (subscribe / one-time download).
 * Body: { reportTypeId, businessCode, userId, reportDate, instruments[], referenceCode }
 * Response: { reportOrderId }
 */
export function orderReport(req: ReportOrderRequest): Promise<{ reportOrderId: number }> {
    return post<{ reportOrderId: number }>('/reports/order/', req);
}

// ══════════════════════════════════════════════════════════════════════════════
// 🔧 NEW ENDPOINTS — mock fallback active until backend implements these
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/reports/shareholder/{reportId}
 * Returns: issuerName, reportName, situationDate, issuerId, shareClasses[], summaryRows[]
 * Called ONCE on page load — does not change with filters/search/pagination.
 *
 * ⏳ Backend status: NOT YET BUILT — returns mock data until available.
 */
export async function fetchReportMetadata(reportId: number): Promise<ReportMetadata> {
    try {
        return await get<ReportMetadata>(`/reports/shareholder/${reportId}/metadata`);
    } catch {
        // Mock fallback — remove once backend endpoint is live
        console.warn(`[API] /reports/shareholder/${reportId}/metadata not available — using mock`);
        return {
            issuerId:      800001,
            issuerName:    'Euroflex Oyj',
            reportName:    'Liikkeeseenlaskijan omistusraportti',
            situationDate: '13.3.2026',
            reportDate:    '2026-01-11',
        };
    }
}

/**
 * GET /api/reports/shareholder/{reportId}/summary
 * Returns summary table rows (one per share class + grand total row).
 * Rows use pre-formatted strings: e.g. ownerCount: "1 300", votesPercentage: "50.3 %"
 *
 * ⏳ Backend status: NOT YET BUILT — returns mock data until available.
 */
export async function fetchSummaryRows(reportId: number): Promise<SummaryRow[]> {
    try {
        return await get<SummaryRow[]>(`/reports/shareholder/${reportId}/summary`);
    } catch {
        console.warn(`[API] /reports/shareholder/${reportId}/summary not available — using mock`);
        return SUMMARY_ROWS as unknown as SummaryRow[];
    }
}

/**
 * GET /api/reports/shareholder/{reportId}/owners
 * Returns paginated, filtered, searchable owner list.
 *
 * Query params:
 *   page            int     default 1  (1-based)
 *   pageSize        int     default 13
 *   search          string  optional — partial name match, case-insensitive
 *   directFilter    boolean
 *   nomineeFilter   boolean
 *   companyFilter   boolean
 *   financialFilter boolean
 *   householdFilter boolean
 *
 * Response: { owners[], totalCount, totalPages, page, pageSize }
 *
 * ⏳ Backend status: NOT YET BUILT — returns mock data until available.
 */
export async function fetchOwners(
    reportId: number,
    params: {
        page:          number;
        pageSize:      number;
        search?:       string;
        activeFilters: FilterKey[];
    },
): Promise<OwnersResponse> {
    const none = params.activeFilters.length === 0;
    try {
        return await get<OwnersResponse>(
            `/reports/shareholder/${reportId}/owners` +
            qs({
                page:            params.page,
                pageSize:        params.pageSize,
                search:          params.search,
                directFilter:    none || params.activeFilters.includes('directly'),
                nomineeFilter:   none || params.activeFilters.includes('nominee'),
                companyFilter:   none || params.activeFilters.includes('companies'),
                financialFilter: none || params.activeFilters.includes('financial'),
                householdFilter: none || params.activeFilters.includes('households'),
            })
        );
    } catch {
        console.warn(`[API] /reports/shareholder/${reportId}/owners not available — using mock`);
        const mock = getMockOwners(params.page, params.pageSize, params.search, params.activeFilters);
        return mock as unknown as OwnersResponse;
    }
}
