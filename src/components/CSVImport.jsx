import { useRef, useState } from 'react'
import { Upload, FileText, AlertTriangle, Check } from 'lucide-react'

function parseCSV(text) {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase())
  const rows = lines.slice(1).map(line => {
    const values = []
    let current = '', inQuotes = false
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes }
      else if (char === ',' && !inQuotes) { values.push(current.trim()); current = '' }
      else { current += char }
    }
    values.push(current.trim())
    return Object.fromEntries(headers.map((h, i) => [h, values[i] || '']))
  }).filter(row => Object.values(row).some(v => v))
  return { headers, rows }
}

function mapField(row, candidates) {
  for (const c of candidates) {
    const val = Object.entries(row).find(([k]) => k.includes(c))
    if (val && val[1]) return val[1]
  }
  return ''
}

function parseAmount(str) {
  if (!str) return 0
  return Math.abs(parseFloat(str.replace(/[$,]/g, '')) || 0)
}

export default function CSVImport({ type, onImport, onClose }) {
  const fileRef = useRef()
  const [preview, setPreview] = useState(null)
  const [mapped, setMapped] = useState([])
  const [error, setError] = useState(null)

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const { headers, rows } = parseCSV(ev.target.result)
        if (rows.length === 0) { setError('No data rows found'); return }
        setPreview({ headers, rows, count: rows.length })

        const items = rows.map(row => {
          if (type === 'receivables') {
            return {
              customer: mapField(row, ['customer', 'client', 'name', 'company', 'debtor']),
              description: mapField(row, ['description', 'desc', 'memo', 'invoice', 'reference', 'ref']),
              amount: parseAmount(mapField(row, ['amount', 'total', 'balance', 'due'])),
              promiseDate: mapField(row, ['promise', 'date', 'due date', 'due_date', 'expected']),
              status: 'open',
            }
          } else {
            return {
              vendor: mapField(row, ['vendor', 'payee', 'name', 'company', 'supplier']),
              description: mapField(row, ['description', 'desc', 'memo', 'invoice', 'reference', 'ref']),
              amount: parseAmount(mapField(row, ['amount', 'total', 'balance', 'due'])),
              payDate: mapField(row, ['pay date', 'pay_date', 'date', 'due date', 'due_date']),
              status: 'open',
            }
          }
        }).filter(item => item.amount > 0)

        setMapped(items)
      } catch (err) {
        setError('Failed to parse CSV: ' + err.message)
      }
    }
    reader.readAsText(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      const dt = new DataTransfer()
      dt.items.add(file)
      fileRef.current.files = dt.files
      handleFile({ target: { files: dt.files } })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Upload size={20} /> Import {type === 'receivables' ? 'Receivables' : 'Payables'} from CSV
            </h3>
            <button onClick={onClose} className="text-[#64748b] hover:text-white text-xl">&times;</button>
          </div>

          {!preview && (
            <>
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-[#334155] rounded-xl p-8 text-center cursor-pointer hover:border-[#3b82f6] transition-colors"
              >
                <FileText size={36} className="mx-auto text-[#64748b] mb-3" />
                <p className="text-[#94a3b8] text-sm">Drop a CSV file here, or <span className="text-[#3b82f6]">click to browse</span></p>
                <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
              </div>
              <div className="mt-4 bg-[#0f172a] rounded-lg p-3">
                <p className="text-xs text-[#64748b] font-medium mb-1">Expected columns ({type === 'receivables' ? 'AR' : 'AP'}):</p>
                <p className="text-xs text-[#94a3b8]">
                  {type === 'receivables'
                    ? 'customer, description, amount, promise date'
                    : 'vendor, description, amount, pay date'}
                </p>
                <p className="text-xs text-[#64748b] mt-1">Column names are flexible — we'll match common variations.</p>
              </div>
            </>
          )}

          {error && (
            <div className="mt-4 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg p-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-[#ef4444]" />
              <p className="text-sm text-[#ef4444]">{error}</p>
            </div>
          )}

          {preview && mapped.length > 0 && (
            <>
              <div className="bg-[#0f172a] rounded-lg p-3 mb-4">
                <p className="text-sm text-[#94a3b8]">
                  Found <span className="text-white font-bold">{mapped.length}</span> valid {type} from {preview.count} rows
                </p>
                <p className="text-xs text-[#64748b] mt-1">Columns detected: {preview.headers.join(', ')}</p>
              </div>

              <div className="max-h-48 overflow-y-auto mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[#64748b] text-xs uppercase">
                      <th className="text-left py-1 px-2">{type === 'receivables' ? 'Customer' : 'Vendor'}</th>
                      <th className="text-left py-1 px-2">Description</th>
                      <th className="text-right py-1 px-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mapped.slice(0, 10).map((item, i) => (
                      <tr key={i} className="border-t border-[#334155]/30">
                        <td className="py-1.5 px-2 text-white">{item.customer || item.vendor || '—'}</td>
                        <td className="py-1.5 px-2 text-[#94a3b8] truncate max-w-[150px]">{item.description || '—'}</td>
                        <td className="py-1.5 px-2 text-right text-[#22c55e] font-mono">${item.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {mapped.length > 10 && <p className="text-xs text-[#64748b] text-center mt-2">...and {mapped.length - 10} more</p>}
              </div>

              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm border border-[#334155] text-[#94a3b8] rounded-lg hover:bg-[#334155]">
                  Cancel
                </button>
                <button onClick={() => { onImport(mapped); onClose() }} className="flex-1 px-4 py-2.5 text-sm bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb] flex items-center justify-center gap-2">
                  <Check size={16} /> Import {mapped.length} Items
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
