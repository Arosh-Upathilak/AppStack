'use client';

import Icon from '@/components/Icon';
import Badge from '@/components/Badge';
import StatTile from '@/components/StatTile';
import { useToastContext } from '@/components/DashboardChrome';
import { INVOICES } from '@/data/mock';

const allInvoices = [...INVOICES, ...INVOICES.map(i => ({ ...i, id: i.id.replace('1', '0') }))];

export default function InvoicesPage() {
  const { toast } = useToastContext();
  return (
    <div className="page screen-enter">
      <div className="page-head">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-sub">Track and download invoices across all your subscriptions.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary"><Icon name="filter" size={13} /> Filter</button>
          <button className="btn btn-primary" onClick={() => toast('All invoices downloaded')}><Icon name="download" size={13} /> Download all</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatTile label="Paid (YTD)" value="$38,420" delta="+22%" deltaDir="up" sub="32 invoices" />
        <StatTile label="This month" value="$2,885" delta="5 invoices" deltaDir="flat" />
        <StatTile label="Overdue" value="$195" delta="1 invoice" deltaDir="down" />
        <StatTile label="Auto-paid" value="98%" delta="of all invoices" deltaDir="flat" />
      </div>
      <div className="card">
        <table className="tbl">
          <thead>
            <tr><th style={{ paddingLeft: 20 }}>Invoice</th><th>Product</th><th>Date</th><th>Due</th><th className="num">Amount</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {allInvoices.map(inv => (
              <tr key={inv.id}>
                <td style={{ paddingLeft: 20, color: 'var(--ink-1)', fontWeight: 500 }}>{inv.id}</td>
                <td>{inv.product}</td>
                <td className="muted">{inv.date}</td>
                <td className="muted">{inv.date}</td>
                <td className="num" style={{ fontWeight: 500 }}>${inv.amount}.00</td>
                <td>{inv.status === 'paid' ? <Badge tone="success" dot>Paid</Badge> : <Badge tone="danger" dot>Overdue</Badge>}</td>
                <td className="col-action">
                  <button className="btn btn-ghost btn-sm" onClick={() => toast('Invoice downloaded')}><Icon name="download" size={12} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
