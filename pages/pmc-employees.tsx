import { useEffect, useState } from 'react'
import Head from 'next/head'
import {
  UserPlus,
  Mail,
  Phone,
  Lock,
  MapPin,
  Hash,
  ShieldCheck,
  RefreshCcw
} from 'lucide-react'
import { DataService, User } from '@/lib/dataService'

const ZONES = ['1', '2', '3', '4', '5']

interface FormState {
  name: string
  employeeCode: string
  email: string
  phone: string
  password: string
  zoneNumber: string
}

export default function PmcEmployeesPage() {
  const [form, setForm] = useState<FormState>({
    name: '',
    employeeCode: '',
    email: '',
    phone: '',
    password: '',
    zoneNumber: ZONES[0]
  })
  const [pmcUsers, setPmcUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const allUsers = await DataService.getAllUsers()
      const pmc = allUsers.filter(user => user.role === 'pmc_member' || user.role === 'pmc_viewer')
      setPmcUsers(pmc)
    } catch (error) {
      console.error('Failed to load PMC employees', error)
      setStatus({ type: 'error', message: 'Could not load PMC employees. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const updateField = (key: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleCreate = async () => {
    setStatus(null)
    if (!form.name.trim() || !form.employeeCode.trim() || !form.email.trim() || !form.phone.trim() || !form.password.trim()) {
      setStatus({ type: 'error', message: 'All fields are required.' })
      return
    }

    setSaving(true)
    try {
      await DataService.createPmcEmployee({
        name: form.name,
        employeeCode: form.employeeCode,
        email: form.email,
        phone: form.phone,
        password: form.password,
        zoneNumber: form.zoneNumber
      })

      setStatus({ type: 'success', message: 'PMC employee login created successfully.' })
      setForm({
        name: '',
        employeeCode: '',
        email: '',
        phone: '',
        password: '',
        zoneNumber: ZONES[0]
      })
      await loadUsers()
    } catch (error) {
      console.error('Failed to create PMC employee', error)
      setStatus({ type: 'error', message: 'Could not create PMC employee. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Delete this PMC employee login? This cannot be undone.')) return
    setDeletingId(userId)
    setStatus(null)
    try {
      await DataService.deletePmcEmployee(userId)
      setStatus({ type: 'success', message: 'PMC employee deleted.' })
      await loadUsers()
    } catch (error) {
      console.error('Failed to delete PMC employee', error)
      setStatus({ type: 'error', message: 'Could not delete PMC employee. Please try again.' })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <Head>
        <title>PMC Employees | SuperAdmin</title>
      </Head>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">PMC Employees</h1>
            <p className="text-gray-600">Create PMC employee logins and manage their assigned zones.</p>
          </div>
          <button
            onClick={loadUsers}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-primary-700 bg-primary-50 border border-primary-100 rounded-lg hover:bg-primary-100 transition-colors"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-primary-50 flex items-center justify-center border border-primary-100">
                  <UserPlus className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Create Login</p>
                  <p className="text-base font-semibold text-gray-900">PMC Employee</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4 text-primary-500" /> Name
                  </span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Employee name"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Hash className="h-4 w-4 text-primary-500" /> Employee Code
                  </span>
                  <input
                    type="text"
                    value={form.employeeCode}
                    onChange={(e) => updateField('employeeCode', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., PMC-101"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Mail className="h-4 w-4 text-primary-500" /> Email
                  </span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="employee@pmc.gov"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Phone className="h-4 w-4 text-primary-500" /> Phone Number
                  </span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="10-digit number"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Lock className="h-4 w-4 text-primary-500" /> Password
                  </span>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Set login password"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-primary-500" /> Zone (1-5)
                  </span>
                  <select
                    value={form.zoneNumber}
                    onChange={(e) => updateField('zoneNumber', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                  >
                    {ZONES.map(zone => (
                      <option key={zone} value={zone}>
                        Zone {zone}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {status && (
                <div
                  className={`rounded-lg px-3 py-2 text-sm border ${status.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : 'bg-red-50 text-red-700 border-red-100'
                    }`}
                >
                  {status.message}
                </div>
              )}

              <button
                onClick={handleCreate}
                disabled={saving}
                className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-70 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                {saving ? 'Creating...' : 'Create PMC Login'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Existing Accounts</p>
                  <p className="text-base font-semibold text-gray-900">PMC Employees ({pmcUsers.length})</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Employee Code</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Zone</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                          Loading PMC employees...
                        </td>
                      </tr>
                    ) : pmcUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                          No PMC employee logins created yet.
                        </td>
                      </tr>
                    ) : (
                      pmcUsers.map(user => (
                        <tr key={user.id}>
                          <td className="px-4 py-3 text-sm text-gray-900">{user.name || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{user.employeeCode || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{user.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{user.phone || '—'}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                            {user.zoneNumber ? `Zone ${user.zoneNumber}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${user.isActive === false
                              ? 'bg-red-100 text-red-700'
                              : 'bg-emerald-50 text-emerald-700'
                              }`}>
                              {user.isActive === false ? 'Inactive' : 'Active'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <button
                              onClick={() => handleDelete(user.id)}
                              disabled={deletingId === user.id}
                              className="text-red-600 hover:text-red-800 font-semibold text-xs border border-red-100 rounded-md px-3 py-1 disabled:opacity-60"
                            >
                              {deletingId === user.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
