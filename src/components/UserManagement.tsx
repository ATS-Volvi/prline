import React, { useState } from 'react';

export const UserManagement: React.FC = () => {
  const [isAdding, setIsAdding] = useState(false);

  return (
    <div className="flex flex-col h-full w-full bg-background animate-fade-in overflow-hidden p-lg gap-lg">
      <div className="flex justify-between items-start shrink-0">
        <div className="flex flex-col">
          <h1 className="font-headline-lg text-primary">User Management</h1>
          <p className="text-secondary text-body-md mt-xs">Manage system access, roles, and administrative permissions.</p>
        </div>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="bg-primary text-on-primary rounded-lg px-md py-sm font-label-lg shadow-sm hover:opacity-90 transition-opacity">
            + Add New User
          </button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden gap-lg">
        <div className="flex-1 overflow-auto custom-scrollbar bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low border-b border-outline-variant sticky top-0 z-10">
              <tr className="uppercase tracking-wider text-label-md text-on-surface-variant">
                <th className="p-md">USER DETAILS</th>
                <th className="p-md">ROLE / PERMISSIONS</th>
                <th className="p-md">LAST LOGIN</th>
                <th className="p-md">STATUS</th>
                <th className="p-md">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {/* Dummy row 1 */}
              <tr className="border-b border-outline-variant hover:bg-surface-container-low transition-colors h-[64px]">
                <td className="p-md">
                  <div className="flex items-center gap-sm">
                    <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container font-bold text-xs flex items-center justify-center">SA</div>
                    <div className="flex flex-col">
                      <span className="font-label-lg text-on-surface">System Admin</span>
                      <span className="font-mono text-[10px] text-on-surface-variant">admin@pepsico.com</span>
                    </div>
                  </div>
                </td>
                <td className="p-md">
                  <span className="bg-on-tertiary-container text-on-tertiary text-[10px] font-bold px-sm py-xs rounded">Plant Admin</span>
                </td>
                <td className="p-md font-mono text-[11px] text-on-surface-variant">Just Now</td>
                <td className="p-md">
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider"></span>
                  </label>
                </td>
                <td className="p-md">
                  <button className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer mr-sm">
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                </td>
              </tr>
              {/* Dummy row 2 */}
              <tr className="border-b border-outline-variant hover:bg-surface-container-low transition-colors h-[64px]">
                <td className="p-md">
                  <div className="flex items-center gap-sm">
                    <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container font-bold text-xs flex items-center justify-center">PS</div>
                    <div className="flex flex-col">
                      <span className="font-label-lg text-on-surface">Prod Supervisor</span>
                      <span className="font-mono text-[10px] text-on-surface-variant">supervisor@pepsico.com</span>
                    </div>
                  </div>
                </td>
                <td className="p-md">
                  <span className="bg-surface-container-high text-on-surface-variant text-[10px] font-bold px-sm py-xs rounded">Production Supervisor</span>
                </td>
                <td className="p-md font-mono text-[11px] text-on-surface-variant">2 hours ago</td>
                <td className="p-md">
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider"></span>
                  </label>
                </td>
                <td className="p-md">
                  <button className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer mr-sm">
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                  <button className="text-on-surface-variant hover:text-error transition-colors cursor-pointer">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {isAdding && (
          <div className="w-80 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm flex flex-col overflow-hidden animate-slide-up">
            <div className="p-md border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
              <h2 className="font-headline-sm font-bold text-primary">Add New User</h2>
              <button onClick={() => setIsAdding(false)} className="text-on-surface-variant hover:text-primary">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-md flex flex-col gap-md flex-1 overflow-y-auto custom-scrollbar">
              <div className="flex flex-col gap-xs">
                <label className="text-label-md text-on-surface-variant uppercase tracking-wider">Full Name</label>
                <input type="text" className="bg-surface-container border border-outline-variant rounded-lg px-md py-sm font-label-lg" placeholder="e.g. Jane Doe" />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="text-label-md text-on-surface-variant uppercase tracking-wider">Email Address</label>
                <input type="email" className="bg-surface-container border border-outline-variant rounded-lg px-md py-sm font-label-lg" placeholder="jane@pepsico.com" />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="text-label-md text-on-surface-variant uppercase tracking-wider">Role</label>
                <select className="bg-surface-container border border-outline-variant rounded-lg px-md py-sm font-label-lg">
                  <option>Plant Admin</option>
                  <option>Production Supervisor</option>
                  <option>HR / Training Coordinator</option>
                  <option>Plant Manager</option>
                </select>
              </div>
              <div className="flex flex-col gap-xs">
                <label className="text-label-md text-on-surface-variant uppercase tracking-wider">Temporary Password</label>
                <input type="password" className="bg-surface-container border border-outline-variant rounded-lg px-md py-sm font-label-lg" placeholder="••••••••" />
              </div>
            </div>
            <div className="p-md border-t border-outline-variant bg-surface-container-lowest">
              <button className="w-full bg-primary text-on-primary rounded-lg px-md py-sm font-label-lg shadow-sm hover:opacity-90 transition-opacity">
                Create User
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
