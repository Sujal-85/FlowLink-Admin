import React, { useEffect, useState } from 'react';
import LayoutWrapper  from '../components/LayoutWrapper';
import { Bell, Phone, Mail, LocateIcon, MapIcon, MapPinCheck } from 'lucide-react';
import { auth as firebaseAuth } from '../services/firebase'
import { getUserProfile, upsertUserProfile, uploadProfilePhoto } from '../services/db'

const Setting = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [profile, setProfile] = useState({ displayName: '', company: '', role: '', phone: '', location: '', photoURL: '' })
  const [saving, setSaving] = useState(false)
  const fileInputRef = React.useRef(null)

  useEffect(() => {
    const user = firebaseAuth.currentUser
    if (!user) return
    ;(async () => {
      const data = await getUserProfile(user.uid)
      setProfile({
        displayName: data?.displayName || user.displayName || '',
        company: data?.company || '',
        role: data?.role || '',
        phone: data?.phone || '',
        location: data?.location || '',
        photoURL: data?.photoURL || user.photoURL || ''
      })
    })()
  }, [])

  const saveProfile = async () => {
    const user = firebaseAuth.currentUser
    if (!user) return
    try {
      setSaving(true)
      await upsertUserProfile(user.uid, profile)
    } finally {
      setSaving(false)
    }
  }

  const openFilePicker = () => fileInputRef.current && fileInputRef.current.click()

  const onPhotoSelected = async (e) => {
    const user = firebaseAuth.currentUser
    if (!user) return
    const file = e.target.files && e.target.files[0]
    if (!file) return
    setSaving(true)
    try {
      const url = await uploadProfilePhoto(user.uid, file)
      setProfile(p => ({ ...p, photoURL: url }))
    } finally {
      setSaving(false)
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview':
        return (
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex flex-col md:flex-row justify-between mb-2 space-y-4 md:space-y-0">
              <div>
                <h3 className="text-sm font-normal">Total Sales</h3>
                <p className="text-lg">$124,580</p>
              </div>
              <div>
                <h3 className="text-sm font-normal">Pending Orders</h3>
                <p className="text-lg">23</p>
              </div>
              <div>
                <h3 className="text-sm font-normal">This Month</h3>
                <p className="text-lg">$18,420</p>
              </div>
            </div>
            <h3 className="text-sm font-normal mb-1">Recent Orders</h3>
            <table className="w-full text-left text-sm border border-[2px] border-gray-200">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-1">Order ID</th>
                  <th className="py-1">Customer</th>
                  <th className="py-1">Status</th>
                  <th className="py-1">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-1">#ORD-2025-001</td>
                  <td className="py-1">Tech Solutions Inc.</td>
                  <td className="py-1"> <label className="px-2 py-1 bg-green-500 text-white rounded-2xl">Completed</label> </td>
                  <td className="py-1">$2,450</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-1">#ORD-2025-002</td>
                  <td className="py-1">Metro Retail Co.</td>
                  <td className="py-1"> <label className="px-2 py-1 bg-green-500 text-white rounded-2xl">Pending</label></td>
                  <td className="py-1">$1,820</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-1">#ORD-2025-003</td>
                  <td className="py-1">Global Supplies Ltd.</td>
                  <td className="py-1"> <label className="px-2 py-1 bg-green-500 text-white rounded-2xl">Delayed</label></td>
                  <td className="py-1">$3,200</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      case 'Orders':
        return (
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-sm font-normal mb-1">Orders</h3>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-1">Order ID</th>
                  <th className="py-1">Customer</th>
                  <th className="py-1">Status</th>
                  <th className="py-1">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-1">#ORD-2025-001</td>
                  <td className="py-1">Tech Solutions Inc.</td>
                  <td className="py-1">Completed</td>
                  <td className="py-1">$2,450</td>
                </tr>
                <tr className="border-b">
                  <td className="py-1">#ORD-2025-002</td>
                  <td className="py-1">Metro Retail Co.</td>
                  <td className="py-1">Pending</td>
                  <td className="py-1">$1,820</td>
                </tr>
                <tr className="py-1 border-b">
                  <td className="py-1">#ORD-2025-003</td>
                  <td className="py-1">Global Supplies Ltd.</td>
                  <td className="py-1">Delayed</td>
                  <td className="py-1">$3,200</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      case 'Inventory':
        return (
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-sm font-normal mb-1">Inventory</h3>
            <p className="text-sm">No inventory data available.</p>
          </div>
        );
      case 'Payments':
        return (
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-sm font-normal mb-1">Payments</h3>
            <p className="text-sm">No payment data available.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <LayoutWrapper>
      <div className="flex">
        <main className="flex-1 p-4">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h1 className="text-2xl font-medium mb-2">Profile</h1>
            <div className="flex justify-center md:justify-start space-x-4 overflow-x-auto">
              <nav className="flex space-x-4 overflow-x-auto pb-2">
                <button
                  className={`px-3 py-1 text-sm ${activeTab === 'Overview' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                  onClick={() => setActiveTab('Overview')}
                >
                  Overview
                </button>
                <button
                  className={`px-3 py-1 text-sm ${activeTab === 'Orders' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                  onClick={() => setActiveTab('Orders')}
                >
                  Orders
                </button>
                <button
                  className={`px-3 py-1 text-sm ${activeTab === 'Inventory' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                  onClick={() => setActiveTab('Inventory')}
                >
                  Inventory
                </button>
                <button
                  className={`px-3 py-1 text-sm ${activeTab === 'Payments' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                  onClick={() => setActiveTab('Payments')}
                >
                  Payments
                </button>
              </nav>
            </div>
            <div className="flex flex-col md:flex-row mt-4">
              <div className="w-full md:w-1/3 md:pr-6 mb-6 md:mb-0">
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="relative">
                      <img
                        src={profile.photoURL || './profile-pic.jpg'}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover"
                      />
                      <button type="button" onClick={openFilePicker} className="absolute bottom-0 right-0 w-7 h-7 flex items-center justify-center rounded-full bg-white border shadow">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5h-2l-2 2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-1l-2-2h-2z"/><circle cx="12" cy="13" r="3"/></svg>
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={onPhotoSelected} style={{ display: 'none' }} />
                    </div>
                    <div>
                      <input className="text-sm border p-1 rounded w-full mb-1" value={profile.displayName} onChange={(e)=>setProfile(p=>({...p, displayName:e.target.value}))} />
                      <input className="text-sm text-gray-600 border p-1 rounded w-full mb-1" placeholder="Role" value={profile.role} onChange={(e)=>setProfile(p=>({...p, role:e.target.value}))} />
                      <input className="text-sm text-gray-600 border p-1 rounded w-full" placeholder="Company" value={profile.company} onChange={(e)=>setProfile(p=>({...p, company:e.target.value}))} />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600"><Phone className="inline mr-1 ]" /> <input className="border p-1 rounded" placeholder="Phone" value={profile.phone} onChange={(e)=>setProfile(p=>({...p, phone:e.target.value}))} /></p>
                  <p className="text-sm text-gray-600"><Mail className="inline mr-1 " /> {firebaseAuth.currentUser?.email || ''}</p>
                  <p className="text-sm text-gray-600"><MapPinCheck className="inline mr-1" /> <input className="border p-1 rounded" placeholder="Location" value={profile.location} onChange={(e)=>setProfile(p=>({...p, location:e.target.value}))} /></p>
                  <button onClick={saveProfile} className="mt-2 bg-green-600 text-white px-3 py-1 text-sm rounded" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
                </div>
              </div>
              <div className="w-full md:w-2/3">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </main>
      </div>
    </LayoutWrapper>
  );
};

export default Setting;