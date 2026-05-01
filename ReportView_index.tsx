import { useState } from 'react';
import {
    Banner,
    Button,
    Container,
    Chip,
    Table,
    TextLink,
    PaginationRoot,
    ButtonIcon,
    InfoIcon,
} from '@efi/efi-ui-components';
import type { Language } from '@/locales';
import { translations } from '@/locales';
import './ReportView.css';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ReportViewProps {
    reportTitle: string;
    reportDate: string;
    language: Language;
    onBack: () => void;
    onSubscribe: () => void;
    onDownload?: () => void;
}

// Report type controls which columns SHOW content — all columns always rendered
type ReportType = 'statutory' | 'full' | 'agm' | 'short';
type SortField = 'name' | 'bookEntries' | 'votes';
type SortDir = 'asc' | 'desc';

interface ShareRow {
    type: string;
    custodian?: string;
    amount: string;
    pct: string;
    votes: string;
    votePct: string;
    isTotal?: boolean;
}

interface OwnerRow {
    id: number;
    name: string;
    ssn: string;
    dob: string;
    asiakasrajoitus?: string;
    isRestricted?: boolean;
    isJoint?: boolean;
    isNominee?: boolean;
    isBank?: boolean;
    isCompany?: boolean;
    city?: string;
    address: string;
    postAddress: string;
    country: string;
    shares: ShareRow[];
    sektori: string;
    maksu: string;
    vero: string;
    situationDate?: string;
    jointOwners?: { name: string; linkable?: boolean }[];
    isJointSubRow?: boolean;
    jointParent?: string;
}

// ─── Column visibility per report type ───────────────────────────────────────
// ALL 12 columns always rendered. showX = whether to show content in that col.
// Ghost space maintained for hidden cols.

const COLS: Record<ReportType, {
    addr: boolean; city: boolean; custodian: boolean;
    pct: boolean; votes: boolean; votePct: boolean;
    date: boolean; sector: boolean; payment: boolean; tax: boolean;
}> = {
    //             addr   city   cust   pct    votes  vpct   date   sec    pay    tax
    statutory: { addr: true,  city: false, custodian: true,  pct: false, votes: false, votePct: false, date: true,  sector: false, payment: true,  tax: true  },
    full:      { addr: true,  city: false, custodian: true,  pct: true,  votes: true,  votePct: true,  date: false, sector: true,  payment: true,  tax: true  },
    agm:       { addr: false, city: true,  custodian: false, pct: false, votes: false, votePct: false, date: false, sector: false, payment: false, tax: false },
    short:     { addr: false, city: false, custodian: true,  pct: true,  votes: false, votePct: false, date: false, sector: false, payment: false, tax: false },
};

// ─── Static data ─────────────────────────────────────────────────────────────

const SHARES_INFO = [
    { name: 'EUROFLEX A', isin: 'FI21049685930', abbr: 'EUROFLA' },
    { name: 'EUROFLEX B', isin: 'FI21049685931', abbr: 'EUROFLB' },
    { name: 'EUROFLEX C', isin: 'FI21049685932', abbr: 'EUROFLC' },
];

const SUMMARY_ROWS = [
    { aoLaji: 'EUROFLA', omistajien: '1 300', yhteis: '12', kaikkien: '1 006 970', osuus: '50,3 %', kokonaisAani: '2 000 000', osakas: '503 488', odotus: '5 000', hallinta: '10 000', yhteistili: '481 512', liikkeeseen: '1 000 000', bold: false, isTotal: false },
    { aoLaji: 'EUROFLB', omistajien: '600',   yhteis: '24', kaikkien: '285 369',   osuus: '71,3 %', kokonaisAani: '400 000',   osakas: '285 369', odotus: '4 800', hallinta: '18 995', yhteistili: '90 836',  liikkeeseen: '400 000',   bold: false, isTotal: false },
    { aoLaji: 'total',   omistajien: '1 900', yhteis: '36', kaikkien: '1 292 339', osuus: '53,8 %', kokonaisAani: '2 400 000', osakas: '788 857', odotus: '9 800', hallinta: '28 995', yhteistili: '572 348', liikkeeseen: '1 400 000', bold: true,  isTotal: true  },
];

const SHOW_DATA_KEYS = ['address', 'isin', 'expired', 'sector', 'custodian'] as const;

const INITIAL_CHIP_KEYS = [
    { key: 'directly', count: 2379, active: true },
    { key: 'nominee',  count: 12,   active: false },
    { key: 'companies',count: 1112, active: true },
    { key: 'financial',count: 23,   active: false },
    { key: 'households',count: 1856,active: true },
] as const;

const OWNER_ROWS: OwnerRow[] = [
    {
        id: 1, name: 'Thomas-Peter Along-lastname', ssn: '120370-8902A', dob: '12.03.1970',
        address: 'Arvo-osuuskuja 212', postAddress: '00550 Espoo', country: 'Espoo, Finland',
        city: 'Espoo', situationDate: '31/12/2024',
        shares: [
            { type: 'EUROFLEX A', custodian: 'OP',     amount: '30 300', pct: '3,03000', votes: '60 900', votePct: '2,54000' },
            { type: 'EUROFLEX B', custodian: 'Nordea', amount: '600',    pct: '0,15000', votes: '',       votePct: '' },
            { type: 'Arvo-osuudet yhteensä', custodian: '', amount: '30 900', pct: '2,21000', votes: '60 900', votePct: '2,54000', isTotal: true },
        ],
        sektori: 'Julkiset yritykset pl. asuntoyhteisö', maksu: 'FI1234567787788', vero: 'TBC',
    },
    {
        id: 2, name: 'Clarck Confidential', ssn: '020377-02908', dob: '02.03.1977',
        isRestricted: true,
        address: 'Yhteyssoite: Jokitie 22 b', postAddress: '00100 Helsinki', country: 'Tai Ei osoitetta',
        city: '', situationDate: '31/12/2024',
        shares: [
            { type: 'EUROFLEX A', custodian: 'OP',     amount: '15', pct: '0,00005', votes: '',    votePct: '' },
            { type: 'EUROFLEX A', custodian: 'Nordea', amount: '15', pct: '0,00005', votes: '',    votePct: '' },
            { type: 'EUROFLEX B', custodian: 'OP',     amount: '40', pct: '0,00004', votes: '100', votePct: '0,00003' },
            { type: 'Arvo-osuudet yhteensä', custodian: '', amount: '70', pct: '0,00003', votes: '100', votePct: '0,00003', isTotal: true },
        ],
        sektori: 'Julkiset yritykset pl. asuntoyhteisö', maksu: 'FI1234567787788', vero: 'TBC',
    },
    {
        id: 3, name: 'D-Yritys OY Ab', ssn: 'T769765-S', dob: '', asiakasrajoitus: 'konkurssi',
        isCompany: true, city: 'Helsinki',
        address: 'Arvopaperie 12', postAddress: '00100 Helsinki', country: 'Helsinki, Finland',
        situationDate: '31/12/2024',
        shares: [
            { type: 'EUROFLEX A', custodian: 'OP',     amount: '30', pct: '0,00005', votes: '',    votePct: '' },
            { type: 'EUROFLEX B', custodian: 'Nordea', amount: '40', pct: '0,00004', votes: '100', votePct: '0,00003' },
            { type: 'Arvo-osuudet yhteensä', custodian: '', amount: '70', pct: '0,00003', votes: '100', votePct: '0,00003', isTotal: true },
        ],
        sektori: 'Julkiset yritykset pl. asuntoyhteisö', maksu: 'FI1234567787788', vero: 'TBC',
    },
    {
        id: 4, name: 'Thomas Elling', ssn: '200274-89020', dob: '20.02.1974',
        isJoint: true, asiakasrajoitus: 'kuolinpesä', city: 'Helsinki',
        address: 'Thomaksentie 12', postAddress: '00100 Helsinki', country: 'Helsinki / Finland',
        situationDate: '31/12/2024',
        shares: [
            { type: 'EUROFLEX A', custodian: 'OP',     amount: '50', pct: '0,00005', votes: '',    votePct: '' },
            { type: 'EUROFLEX B', custodian: 'Nordea', amount: '60', pct: '0,00004', votes: '160', votePct: '0,00003' },
            { type: 'Arvo-osuudet yhteensä', custodian: '', amount: '110', pct: '0,00003', votes: '160', votePct: '0,00003', isTotal: true },
        ],
        sektori: 'Julkiset yritykset pl. asuntoyhteisö', maksu: 'FI1234567787788', vero: 'TBC',
    },
    {
        id: 5, name: 'Thomas Elling', ssn: '200274-89020', dob: '20.02.1974',
        isJoint: true, asiakasrajoitus: 'kuolinpesä', city: 'Helsinki',
        address: 'Thomaksentie 12', postAddress: '00100 Helsinki', country: 'Helsinki / Finland',
        situationDate: '31/12/2024',
        shares: [
            { type: 'EUROFLEX A', custodian: 'OP',     amount: '30', pct: '0,00005', votes: '',    votePct: '' },
            { type: 'EUROFLEX B', custodian: 'Nordea', amount: '40', pct: '0,00004', votes: '603', votePct: '0,00003' },
            { type: 'Arvo-osuudet yhteensä', custodian: '', amount: '70', pct: '0,00003', votes: '603', votePct: '0,00003', isTotal: true },
        ],
        jointOwners: [{ name: 'Tiina Ollila' }, { name: 'Veijo Välisää', linkable: true }],
        sektori: 'Julkiset yritykset pl. asuntoyhteisö', maksu: 'FI1234567787788', vero: 'TBC',
    },
    {
        id: 6, name: 'William Elling', ssn: '180372-89020', dob: '18.03.1972',
        city: 'Helsinki', address: 'Viljaminkuja 22 b 33', postAddress: '00100 Helsinki', country: 'Helsinki, Finland',
        situationDate: '31/12/2024',
        shares: [
            { type: 'EUROFLEX A', custodian: 'OP',     amount: '30', pct: '0,00005', votes: '',    votePct: '' },
            { type: 'EUROFLEX B', custodian: 'Nordea', amount: '40', pct: '0,00004', votes: '603', votePct: '0,00003' },
            { type: 'Arvo-osuudet yhteensä', custodian: '', amount: '70', pct: '0,00003', votes: '603', votePct: '0,00003', isTotal: true },
        ],
        sektori: 'Julkiset yritykset pl. asuntoyhteisö', maksu: 'FI1234567787788', vero: 'TBC',
    },
    {
        id: 7, name: 'Elli Ollinen', ssn: '120378-1902B', dob: '12.03.1978',
        isJointSubRow: true, jointParent: 'Thomas Elling',
        city: 'Helsinki', address: 'Elisenkuja 6 B', postAddress: '00100 Helsinki', country: 'Helsinki/Finland',
        shares: [], sektori: '', maksu: '', vero: '',
    },
    {
        id: 8, name: 'Sakari Penttinen', ssn: '220368-3456A', dob: '23.03.1968',
        city: 'Helsinki', address: 'Sakarianpolku 1 C', postAddress: '00100 Helsinki', country: 'Helsinki, Finland',
        situationDate: '31/12/2024',
        shares: [
            { type: 'EUROFLEX A', custodian: 'OP', amount: '30', pct: '0,00005', votes: '3', votePct: '0,00005' },
            { type: 'Arvo-osuudet yhteensä', custodian: '', amount: '30', pct: '0,00005', votes: '3', votePct: '0,00005', isTotal: true },
        ],
        sektori: 'Julkiset yritykset pl. asuntoyhteisö', maksu: 'FI1234567787788', vero: 'TBC',
    },
    {
        id: 9, name: 'SEC Custody Bank', ssn: '1169765-6', dob: '',
        isBank: true, isNominee: true, city: 'Helsinki',
        address: 'Pankkiirinkatu 32', postAddress: '00100 Helsinki', country: 'Helsinki / Finland',
        situationDate: '31/12/2024',
        shares: [
            { type: 'EUROFLEX A', custodian: 'OP',     amount: '120', pct: '0,00010', votes: '70', votePct: '0,00010' },
            { type: 'EUROFLEX B', custodian: 'Nordea', amount: '60',  pct: '0,00010', votes: '',   votePct: '' },
            { type: 'Arvo-osuudet yhteensä', custodian: '', amount: '180', pct: '0,00008', votes: '70', votePct: '0,00010', isTotal: true },
        ],
        sektori: 'Julkiset yritykset pl. asuntoyhteisö', maksu: 'FI1234567787788', vero: 'TBC',
    },
];

// ─── Ghost cell helper ────────────────────────────────────────────────────────
// Returns empty cell that preserves column space
function GhostCell() {
    return <Table.BodyCell><span className="rv__ghost"> </span></Table.BodyCell>;
}

// ─── Owner table row ─────────────────────────────────────────────────────────

function OwnerTableRow({ row, cols, t }: { row: OwnerRow; cols: typeof COLS[ReportType]; t: import('@/locales').Translations['reportView'] }) {
    if (row.isJointSubRow) {
        return (
            <Table.Row className="rv__row--joint-sub">
                {/* Name col */}
                <Table.BodyCell>
                    <div className="rv__name-cell">
                        <div className="rv__name-row">
                            <span className="rv__flag">🔗</span>
                            <span className="rv__sub-label">{t.jointSubLabel}</span>
                        </div>
                        <div className="rv__joint-parent">{t.jointParentLabel}: <TextLink href="#">{row.jointParent}</TextLink></div>
                        <span className="rv__ssn-text">{row.ssn}</span>
                        {row.dob && <span className="rv__ssn-text">{row.dob}</span>}
                    </div>
                </Table.BodyCell>
                {/* Address — ghost if not shown */}
                {cols.addr ? (
                    <Table.BodyCell>
                        <span className="rv__cell-sm">{row.address}<br />{row.postAddress}<br />{row.country}</span>
                    </Table.BodyCell>
                ) : <GhostCell />}
                {/* City */}
                {cols.city ? <Table.BodyCell><span className="rv__cell-sm">{row.city}</span></Table.BodyCell> : <GhostCell />}
                {/* Share type */}
                <Table.BodyCell><span className="rv__cell-muted">—</span></Table.BodyCell>
                {/* Custodian */}
                {cols.custodian ? <Table.BodyCell><span className="rv__cell-muted">—</span></Table.BodyCell> : <GhostCell />}
                {/* Amount */}
                <Table.BodyCell><span className="rv__cell-muted">—</span></Table.BodyCell>
                {/* Pct */}
                {cols.pct ? <Table.BodyCell><span className="rv__cell-muted">—</span></Table.BodyCell> : <GhostCell />}
                {/* Votes */}
                {cols.votes ? <Table.BodyCell><span className="rv__cell-muted">—</span></Table.BodyCell> : <GhostCell />}
                {/* VotePct */}
                {cols.votePct ? <Table.BodyCell><span className="rv__cell-muted">—</span></Table.BodyCell> : <GhostCell />}
                {/* Date */}
                {cols.date ? <Table.BodyCell><span className="rv__cell-muted">—</span></Table.BodyCell> : <GhostCell />}
                {/* Sector */}
                {cols.sector ? <Table.BodyCell><span className="rv__cell-muted">—</span></Table.BodyCell> : <GhostCell />}
                {/* Payment */}
                {cols.payment ? <Table.BodyCell><span className="rv__cell-muted">—</span></Table.BodyCell> : <GhostCell />}
                {/* Tax */}
                {cols.tax ? <Table.BodyCell><span className="rv__cell-muted">—</span></Table.BodyCell> : <GhostCell />}
            </Table.Row>
        );
    }

    return (
        <Table.Row>
            {/* ── Name ── */}
            <Table.BodyCell>
                <div className="rv__name-cell">
                    <div className="rv__name-row">
                        {row.isBank && <span className="rv__flag" title={t.flagNomineeReg}>🏦</span>}
                        {row.isCompany && !row.isBank && <span className="rv__flag" title={t.flagNomineeReg}>🏢</span>}
                        <TextLink href="#"><strong>{row.name}</strong></TextLink>
                        {row.isRestricted && <span className="rv__flag" title={t.flagNonDisclosure}>🚫</span>}
                        {row.isNominee && !row.isBank && <span className="rv__flag" title={t.flagNominee}>📋</span>}
                    </div>
                    <span className="rv__ssn-text">{row.ssn}</span>
                    {row.dob && <span className="rv__ssn-text">{row.dob}</span>}
                    {row.asiakasrajoitus && <span className="rv__restriction">{t.customerRestriction}: {row.asiakasrajoitus}</span>}
                    {row.isJoint && row.jointOwners && (
                        <div className="rv__joint-section">
                            <span className="rv__flag">🔗</span>
                            <span className="rv__joint-label">Yhteisomistus:</span>
                            {row.jointOwners.map((o, i) => (
                                <span key={i} className="rv__cell-sm">
                                    {o.linkable ? <TextLink href="#">{o.name}</TextLink> : o.name}
                                    {i < (row.jointOwners?.length ?? 0) - 1 && ', '}
                                </span>
                            ))}
                            <button type="button" className="rv__joint-toggle">Vai avattava? ›</button>
                        </div>
                    )}
                </div>
            </Table.BodyCell>

            {/* ── Address — ghost if not in this report type ── */}
            {cols.addr ? (
                <Table.BodyCell>
                    <span className="rv__cell-sm">{row.address}<br />{row.postAddress}<br />{row.country}</span>
                </Table.BodyCell>
            ) : <GhostCell />}

            {/* ── City (AGM only) — ghost otherwise ── */}
            {cols.city ? (
                <Table.BodyCell><span className="rv__cell-sm">{row.city}</span></Table.BodyCell>
            ) : <GhostCell />}

            {/* ── Share type — always visible, vertical list ── */}
            <Table.BodyCell>
                <div className="rv__shares-vertical">
                    {row.shares.map((s, i) => (
                        <div key={i} className={s.isTotal ? 'rv__cell-total' : 'rv__cell-sm'}>
                            {s.isTotal ? t.totalSharesLabel : s.type}
                        </div>
                    ))}
                </div>
            </Table.BodyCell>

            {/* ── Custodian — ghost if not shown ── */}
            {cols.custodian ? (
                <Table.BodyCell>
                    <div className="rv__shares-vertical">
                        {row.shares.map((s, i) => (
                            <div key={i} className="rv__cell-sm">{s.isTotal ? '' : (s.custodian || '')}</div>
                        ))}
                    </div>
                </Table.BodyCell>
            ) : <GhostCell />}

            {/* ── Amount — always visible ── */}
            <Table.BodyCell align="middle-right">
                <div className="rv__shares-vertical">
                    {row.shares.map((s, i) => (
                        <div key={i} className={s.isTotal ? 'rv__cell-total' : 'rv__cell-sm'}>{s.amount}</div>
                    ))}
                </div>
            </Table.BodyCell>

            {/* ── Pct — ghost if not shown ── */}
            {cols.pct ? (
                <Table.BodyCell align="middle-right">
                    <div className="rv__shares-vertical">
                        {row.shares.map((s, i) => (
                            <div key={i} className="rv__cell-sm">{s.pct}</div>
                        ))}
                    </div>
                </Table.BodyCell>
            ) : <GhostCell />}

            {/* ── Votes — ghost if not shown ── */}
            {cols.votes ? (
                <Table.BodyCell align="middle-right">
                    <div className="rv__shares-vertical">
                        {row.shares.map((s, i) => (
                            <div key={i} className={s.isTotal ? 'rv__cell-total' : 'rv__cell-sm'}>{s.votes || ''}</div>
                        ))}
                    </div>
                </Table.BodyCell>
            ) : <GhostCell />}

            {/* ── Vote % — ghost if not shown ── */}
            {cols.votePct ? (
                <Table.BodyCell align="middle-right">
                    <div className="rv__shares-vertical">
                        {row.shares.map((s, i) => (
                            <div key={i} className="rv__cell-sm">{s.votePct || ''}</div>
                        ))}
                    </div>
                </Table.BodyCell>
            ) : <GhostCell />}

            {/* ── Situation date — ghost if not shown ── */}
            {cols.date ? (
                <Table.BodyCell><span className="rv__cell-sm">{row.situationDate}</span></Table.BodyCell>
            ) : <GhostCell />}

            {/* ── Sector — ghost if not shown ── */}
            {cols.sector ? (
                <Table.BodyCell><span className="rv__cell-sm">{row.sektori}</span></Table.BodyCell>
            ) : <GhostCell />}

            {/* ── Payment — ghost if not shown ── */}
            {cols.payment ? (
                <Table.BodyCell><span className="rv__cell-sm">{row.maksu}</span></Table.BodyCell>
            ) : <GhostCell />}

            {/* ── Tax — ghost if not shown ── */}
            {cols.tax ? (
                <Table.BodyCell><span className="rv__cell-sm">{row.vero}</span></Table.BodyCell>
            ) : <GhostCell />}
        </Table.Row>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReportView({ reportTitle, reportDate, language, onBack, onSubscribe, onDownload }: ReportViewProps) {
    const t = translations[language].reportView;

    // State
    const [activeTab, setActiveTab] = useState<'report' | 'subscription'>('report');
    // Default = statutory (Issuer's shareholder list) per spec
    const [reportType, setReportType] = useState<ReportType>('statutory');
    const [showData, setShowData] = useState<Record<string, boolean>>(
        Object.fromEntries(SHOW_DATA_KEYS.map(k => [k, true]))
    );
    const [chips, setChips] = useState(INITIAL_CHIP_KEYS.map(c => ({ ...c })));
    const [search, setSearch] = useState('');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDir, setSortDir] = useState<SortDir>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 14;

    const cols = COLS[reportType];

    // Translated chip labels
    const chipLabels: Record<string, string> = {
        directly: t.chipDirectly, nominee: t.chipNominee, companies: t.chipCompanies,
        financial: t.chipFinancial, households: t.chipHouseholds,
    };
    // Translated show-data options
    const showDataOptions = [
        { key: 'address', label: t.showOptAddress },
        { key: 'isin',    label: t.showOptIsin },
        { key: 'expired', label: t.showOptExpired },
        { key: 'sector',  label: t.showOptSector },
        { key: 'custodian', label: t.showOptCustodian },
    ];
    // Sidebar description per report type
    const sidebarDesc: Record<ReportType, string> = {
        full: t.sidebarFull, agm: t.sidebarAgm,
        statutory: t.sidebarStatutory, short: t.sidebarShort,
    };

    const toggleChip = (key: string) =>
        setChips(prev => prev.map(c => c.key === key ? { ...c, active: !c.active } : c));

    // Report type options — Issuer's shareholder list first (default per spec)
    const reportTypeOptions: { key: ReportType; title: string; desc: string }[] = [
        { key: 'statutory', title: t.reportTypeStatutoryTitle, desc: t.reportTypeStatutoryDesc },
        { key: 'full',      title: t.reportTypeFullTitle,      desc: t.reportTypeFullDesc },
        { key: 'agm',       title: t.reportTypeAgmTitle,       desc: t.reportTypeAgmDesc },
        { key: 'short',     title: t.reportTypeShortTitle,     desc: t.reportTypeShortDesc },
    ];

    const filteredRows = OWNER_ROWS.filter(row =>
        !search || row.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            {/* ── Banner with efi Banner.Tabs + Actions ── */}
            <Banner appName="MyEuroclear" sticky={true}>
                <Banner.Title>{reportDate} {reportTitle}</Banner.Title>
                <Banner.Actions>
                    <button type="button" className="rv__download-btn" onClick={onDownload}>
                        {/* ico_download */}
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            <path d="M7 11l5 5 5-5M12 4v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {t.downloadFile}
                        {/* ico_sm_dropdown */}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                </Banner.Actions>
                <Banner.Tabs
                    value={activeTab}
                    onValueChange={(val: string) => setActiveTab(val as 'report' | 'subscription')}
                >
                    <Banner.Tab value="report">{t.tabReport}</Banner.Tab>
                    <Banner.Tab value="subscription">{t.tabSubscriptionInfo}</Banner.Tab>
                </Banner.Tabs>
            </Banner>

            <Container>
                <div className="rv">

                    {activeTab === 'report' && (
                        <>
                            {/* ══ SUMMARY CARD ══ */}
                            <section className="rv__summary-card">
                                <h2 className="rv__section-title">{t.summaryTitle}</h2>
                                <div className="rv__info-row">
                                    <div className="rv__info-block">
                                        <h4 className="rv__info-heading">{t.infoTitle}</h4>
                                        <p className="rv__info-line">{t.issuer}: <strong>Euroflex Oyj</strong></p>
                                        <p className="rv__info-line">{t.reportName}: <strong>Liikkeeseenlaskijan omistusraportti</strong></p>
                                        <p className="rv__info-line">{t.situationDate}: <strong>13.3.2026</strong></p>
                                    </div>
                                    <div className="rv__shares-block">
                                        <h4 className="rv__info-heading">Arvo-osuudet</h4>
                                        <div className="rv__shares-grid">
                                            {SHARES_INFO.map(s => (
                                                <div key={s.isin} className="rv__share-col">
                                                    <p className="rv__info-line">{t.shareNameLabel}: <strong>{s.name}</strong></p>
                                                    <p className="rv__info-line">{t.isinLabel}: <strong>{s.isin}</strong></p>
                                                    <p className="rv__info-line">{t.abbreviationLabel}: <strong>{s.abbr}</strong></p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <h3 className="rv__sub-title">Yhteenveto</h3>
                                <div className="rv__summary-table-wrap">
                                    <Table layout="fixed" hover striped>
                                        <Table.Head>
                                            <Table.Row>
                                                <Table.HeadCell column="ao" sortable>{t.summColBookEntry}</Table.HeadCell>
                                                <Table.HeadCell column="om">{t.summColOwners}</Table.HeadCell>
                                                <Table.HeadCell column="yh">{t.summColJointOwners}</Table.HeadCell>
                                                <Table.HeadCell column="kk">{t.summColVotesConferred}</Table.HeadCell>
                                                <Table.HeadCell column="os">{t.summColPctVotes}</Table.HeadCell>
                                                <Table.HeadCell column="ka">{t.summColTotalVotes}</Table.HeadCell>
                                                <Table.HeadCell column="ol">{t.summColInShareholderList}</Table.HeadCell>
                                                <Table.HeadCell column="od">{t.summColInWaitingList}</Table.HeadCell>
                                                <Table.HeadCell column="hr">{t.summColNomineeReg}</Table.HeadCell>
                                                <Table.HeadCell column="yt">{t.summColJointAccount}</Table.HeadCell>
                                                <Table.HeadCell column="lm">{t.summColIssuedAmount}</Table.HeadCell>
                                            </Table.Row>
                                        </Table.Head>
                                        <Table.Body>
                                            {SUMMARY_ROWS.map(row => (
                                                <Table.Row key={row.aoLaji}>
                                                    <Table.BodyCell>
                                                        {row.bold
                                                            ? <strong>{row.isTotal ? t.summaryTotal : row.aoLaji}</strong>
                                                            : row.aoLaji}
                                                    </Table.BodyCell>
                                                    <Table.BodyCell>{row.omistajien}</Table.BodyCell>
                                                    <Table.BodyCell>{row.yhteis}</Table.BodyCell>
                                                    <Table.BodyCell>{row.kaikkien}</Table.BodyCell>
                                                    <Table.BodyCell>{row.osuus}</Table.BodyCell>
                                                    <Table.BodyCell>{row.kokonaisAani}</Table.BodyCell>
                                                    <Table.BodyCell>{row.osakas}</Table.BodyCell>
                                                    <Table.BodyCell>{row.odotus}</Table.BodyCell>
                                                    <Table.BodyCell>{row.hallinta}</Table.BodyCell>
                                                    <Table.BodyCell>{row.yhteistili}</Table.BodyCell>
                                                    <Table.BodyCell>{row.liikkeeseen}</Table.BodyCell>
                                                </Table.Row>
                                            ))}
                                        </Table.Body>
                                    </Table>
                                </div>
                            </section>

                            {/* ══ FILTERS + SIDEBAR — 80/20 ══ */}
                            <div className="rv__content-layout">

                                {/* LEFT 80% */}
                                <div className="rv__filters-left">

                                    {/* Report type */}
                                    <section className="rv__filter-section">
                                        <h3 className="rv__filter-label">
                                            {t.reportTypeTitle}
                                            <ButtonIcon className="rv__info-btn" aria-label="Report type info">
                                                <InfoIcon />
                                            </ButtonIcon>
                                        </h3>
                                        <div className="rv__radio-row">
                                            {reportTypeOptions.map(({ key, title, desc }) => (
                                                <label key={key} className="rv__radio-option">
                                                    <input
                                                        type="radio"
                                                        name="reportType"
                                                        checked={reportType === key}
                                                        onChange={() => setReportType(key)}
                                                        className="rv__radio-input"
                                                    />
                                                    <span className="rv__radio-content">
                                                        <span className="rv__radio-title">{title}</span>
                                                        <span className="rv__radio-desc">{desc}</span>
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </section>

                                    {/* Show data */}
                                    <section className="rv__filter-section">
                                        <h3 className="rv__filter-label">
                                            {t.showDataTitle}
                                            <ButtonIcon className="rv__info-btn" aria-label="Show data info">
                                                <InfoIcon />
                                            </ButtonIcon>
                                        </h3>
                                        <div className="rv__checkbox-row">
                                            {showDataOptions.map(opt => (
                                                <label key={opt.key} className="rv__checkbox-option">
                                                    <input
                                                        type="checkbox"
                                                        checked={showData[opt.key]}
                                                        onChange={() => setShowData(p => ({ ...p, [opt.key]: !p[opt.key] }))}
                                                        className="rv__checkbox-input"
                                                    />
                                                    <span className="rv__checkbox-label">{opt.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </section>

                                    {/* Filtering */}
                                    <section className="rv__filter-section rv__filter-section--last">
                                        <h3 className="rv__filter-label">
                                            {t.filterTitle}
                                            <ButtonIcon className="rv__info-btn" aria-label="Filtering info">
                                                <InfoIcon />
                                            </ButtonIcon>
                                        </h3>
                                        <div className="rv__chips-row">
                                            {chips.map(chip => (
                                                <Chip
                                                    key={chip.key}
                                                    mode="selectable"
                                                    size="medium"
                                                    selected={chip.active}
                                                    onClick={() => toggleChip(chip.key)}
                                                >
                                                    {chipLabels[chip.key]}
                                                    <Chip.Counter>{chip.count}</Chip.Counter>
                                                </Chip>
                                            ))}
                                        </div>
                                    </section>
                                </div>

                                {/* RIGHT 20% — sidebar */}
                                <div className="rv__sidebar">
                                    <section className="rv__sidebar-section">
                                        <h4 className="rv__sidebar-title">{t.reportTypeTitle}</h4>
                                        <p className="rv__sidebar-text" style={{ whiteSpace: 'pre-line' }}>{sidebarDesc[reportType]}</p>
                                    </section>
                                    <section className="rv__sidebar-section">
                                        <h4 className="rv__sidebar-title">{t.showDataTitle}</h4>
                                        <p className="rv__sidebar-text">In the Show details section, you can control which columns are displayed in the table.</p>
                                    </section>
                                    <section className="rv__sidebar-section">
                                        <h4 className="rv__sidebar-title">{t.filterTitle}</h4>
                                        <p className="rv__sidebar-text">Filters allow you to control the content shown in the table. Clearing an option filters the table so that those holdings are excluded.</p>
                                    </section>
                                    <section className="rv__sidebar-section rv__sidebar-section--last">
                                        <h4 className="rv__sidebar-title">{t.fileDownloadTitle}</h4>
                                        <p className="rv__sidebar-text">{t.fileDownloadSidebarDesc}</p>
                                    </section>
                                </div>
                            </div>

                            {/* ══ SEARCH + LEGEND — one line ══ */}
                            <div className="rv__search-and-legend">
                                <p className="rv__filter-summary">
                                    {t.filteredSummary
                                        .replace('{owners}', String(filteredRows.length))
                                        .replace('{shares}', String(filteredRows.reduce((s, r) => s + r.shares.length, 0)))
                                    }
                                </p>
                                <div className="rv__search-box">
                                    <input
                                        type="text"
                                        placeholder={t.searchPlaceholder}
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && console.log('Search:', search)}
                                        className="rv__search-input"
                                    />
                                    <span className="rv__search-icon">🔍</span>
                                </div>
                                <div className="rv__legend-row">
                                    <span className="rv__legend-item">🚫 {t.legendNonDisclosure}</span>
                                    <span className="rv__legend-item">🔗 {t.legendJointOwnership}</span>
                                    <span className="rv__legend-item">📋 {t.legendNomineeHolding}</span>
                                    <span className="rv__legend-item">🏦 {t.legendNomineeCustodians}</span>
                                </div>
                            </div>

                            {/* ══ OWNER TABLE — fixed layout, ghost columns ══ */}
                            <div className="rv__table-wrap">
                                <Table layout="fixed" hover>
                                    <Table.Head>
                                        <Table.Row>
                                            {/* Col 1 — Name, always teal sort col */}
                                            <Table.HeadCell column="name" sortable className="rv__col--sort rv__th" style={{ width: '13%' }}>
                                                {t.colName}
                                                <Table.SecondaryText>{t.colIdentCode}</Table.SecondaryText>
                                                <Table.SecondaryText>{t.colDob}</Table.SecondaryText>
                                                <Table.SecondaryText>{t.colCustomerRestrictions}</Table.SecondaryText>
                                            </Table.HeadCell>
                                            {/* Col 2 — Address, ghost header if not shown */}
                                            <Table.HeadCell column="addr" className={`rv__th ${!cols.addr ? 'rv__th--ghost' : ''}`} style={{ width: '11%' }}>
                                                {cols.addr ? <>{t.colStreetAddress}<Table.SecondaryText>{t.colPostAddress}</Table.SecondaryText><Table.SecondaryText>{t.colMunicipalityCountry}</Table.SecondaryText></> : ''}
                                            </Table.HeadCell>
                                            {/* Col 3 — City (AGM) / ghost */}
                                            <Table.HeadCell column="city" className={`rv__th ${!cols.city ? 'rv__th--ghost' : ''}`} style={{ width: '7%' }}>
                                                {cols.city ? t.colMunicipality : ''}
                                            </Table.HeadCell>
                                            {/* Col 4 — Share type, always shown */}
                                            <Table.HeadCell column="type" className="rv__th" style={{ width: '12%' }}>
                                                {t.colBookEntryType}
                                            </Table.HeadCell>
                                            {/* Col 5 — Custodian, ghost if not shown */}
                                            <Table.HeadCell column="cust" className={`rv__th ${!cols.custodian ? 'rv__th--ghost' : ''}`} style={{ width: '8%' }}>
                                                {cols.custodian ? t.colDepositoryParticipant : ''}
                                            </Table.HeadCell>
                                            {/* Col 6 — Amount, always shown */}
                                            <Table.HeadCell column="amt" align="right" className="rv__th" style={{ width: '7%' }}>
                                                {t.colNumberOfBookEntries}
                                            </Table.HeadCell>
                                            {/* Col 7 — Pct, ghost if not shown */}
                                            <Table.HeadCell column="pct" align="right" className={`rv__th ${!cols.pct ? 'rv__th--ghost' : ''}`} style={{ width: '8%' }}>
                                                {cols.pct ? t.colPctBookEntries : ''}
                                            </Table.HeadCell>
                                            {/* Col 8 — Votes */}
                                            <Table.HeadCell column="votes" align="right" className={`rv__th ${!cols.votes ? 'rv__th--ghost' : ''}`} style={{ width: '7%' }}>
                                                {cols.votes ? t.colNumberOfVotes : ''}
                                            </Table.HeadCell>
                                            {/* Col 9 — Vote pct */}
                                            <Table.HeadCell column="vpct" align="right" className={`rv__th ${!cols.votePct ? 'rv__th--ghost' : ''}`} style={{ width: '8%' }}>
                                                {cols.votePct ? t.colPctVotingRights : ''}
                                            </Table.HeadCell>
                                            {/* Col 10 — Date */}
                                            <Table.HeadCell column="date" sortable className={`rv__th ${!cols.date ? 'rv__th--ghost' : ''}`} style={{ width: '7%' }}>
                                                {cols.date ? t.colSituationDate : ''}
                                            </Table.HeadCell>
                                            {/* Col 11 — Sector */}
                                            <Table.HeadCell column="sec" className={`rv__th ${!cols.sector ? 'rv__th--ghost' : ''}`} style={{ width: '8%' }}>
                                                {cols.sector ? t.colSector : ''}
                                            </Table.HeadCell>
                                            {/* Col 12 — Payment */}
                                            <Table.HeadCell column="pay" className={`rv__th ${!cols.payment ? 'rv__th--ghost' : ''}`} style={{ width: '7%' }}>
                                                {cols.payment ? t.colPaymentInfo : ''}
                                            </Table.HeadCell>
                                            {/* Col 13 — Tax */}
                                            <Table.HeadCell column="tax" className={`rv__th ${!cols.tax ? 'rv__th--ghost' : ''}`} style={{ width: '6%' }}>
                                                {cols.tax ? t.colTaxInfo : ''}
                                            </Table.HeadCell>
                                        </Table.Row>
                                    </Table.Head>
                                    <Table.Body>
                                        {filteredRows.map(row => (
                                            <OwnerTableRow key={row.id} row={row} cols={cols} t={t} />
                                        ))}
                                    </Table.Body>
                                </Table>
                            </div>

                            {/* ══ PAGINATION ══ */}
                            <div className="rv__pagination">
                                <PaginationRoot
                                    as="button"
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    maxPages={5}
                                    onPageChange={(page: number) => setCurrentPage(page)}
                                    showFirst
                                    showLast
                                    showNext
                                    showPrevious
                                    ariaLabels={{
                                        first: 'Move to first page',
                                        last: 'Move to last page',
                                        nav: 'Navigate between paginated table',
                                        next: 'Move to next page',
                                        page: 'Move to page',
                                        previous: 'Move to previous page',
                                    }}
                                />
                            </div>
                        </>
                    )}

                    {activeTab === 'subscription' && (
                        <div className="rv__subscription-tab">
                            <p>Subscription info — coming soon</p>
                        </div>
                    )}
                </div>
            </Container>
        </>
    );
}
