const Accounts = () => {
  return (
    <div className="p-8 bg-white/70 rounded-2xl border border-gold/15 shadow-sm">
      <h1 className="font-display text-2xl font-semibold text-ink mb-4">Admin Accounts</h1>
      <p className="text-ink-soft mb-6">Manage admin users for the Sugandhit Studio admin panel.</p>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="border-b border-gold/15">
              <th className="p-3 text-left text-ink font-medium">Name</th>
              <th className="p-3 text-left text-ink font-medium">Email</th>
              <th className="p-3 text-left text-ink font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gold/10">
              <td className="p-3">Super Admin</td>
              <td className="p-3">superadmin@admin.com</td>
              <td className="p-3">superadmin</td>
            </tr>
            <tr className="border-b border-gold/10">
              <td className="p-3">Manager</td>
              <td className="p-3">manager@sugandhit.com</td>
              <td className="p-3">admin</td>
            </tr>
            <tr className="border-b border-gold/10">
              <td className="p-3">Editor</td>
              <td className="p-3">editor@sugandhit.com</td>
              <td className="p-3">editor</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Accounts;