'use client';

import React, { useState } from 'react';

interface Role {
  id: string;
  name: string;
  type: string;
  permissions: PermissionMatrix;
  createdAt: string;
  updatedAt: string;
}

interface PermissionMatrix {
  // Permission Summary (System-Controlled)
  viewAllJobs: boolean;
  createEditDeleteJobs: boolean;
  assignTasksToLabor: boolean;
  submitTimeMaterials: boolean;
  generateSendInvoices: boolean;
  uploadSupplierMaterialSheet: boolean;
  viewFinancialReports: boolean;
  
  // JOB-Roles & Permissions
  createJob: boolean;
  editJobDetails: boolean;
  assignContractor: boolean;
  receiveAssignmentNotification: boolean;
  viewAssignedJob: boolean;
  modifyJobTypeBilling: boolean;
  
  // Invoice Permissions
  canCreateInvoices: boolean;
  accessToInvoices: string; // "Full access", "Limited access", "No access", etc.
  
  // Invoice Actions by Role
  createInvoice: boolean;
  editInvoiceBeforeFinalizing: boolean;
  approveFinalizeInvoice: boolean;
  sendInvoiceToClient: boolean;
  viewAllInvoices: boolean;
  markInvoiceAsPaid: boolean;
  viewInvoicePDF: boolean;
}

const RolePermission: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([
    {
      id: '1',
      name: 'Admin',
      type: 'System',
      permissions: {
        // Permission Summary
        viewAllJobs: true,
        createEditDeleteJobs: true,
        assignTasksToLabor: true,
        submitTimeMaterials: false,
        generateSendInvoices: true,
        uploadSupplierMaterialSheet: true,
        viewFinancialReports: true,
        
        // Job Permissions
        createJob: true,
        editJobDetails: true,
        assignContractor: true,
        receiveAssignmentNotification: true,
        viewAssignedJob: true,
        modifyJobTypeBilling: true,
        
        // Invoice Permissions
        canCreateInvoices: true,
        accessToInvoices: 'Full access (all invoices, markup, import/export)',
        
        // Invoice Actions
        createInvoice: true,
        editInvoiceBeforeFinalizing: true,
        approveFinalizeInvoice: true,
        sendInvoiceToClient: true,
        viewAllInvoices: true,
        markInvoiceAsPaid: true,
        viewInvoicePDF: true,
      },
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01'
    },
    {
      id: '2',
      name: 'Staff',
      type: 'System',
      permissions: {
        // Permission Summary
        viewAllJobs: true,
        createEditDeleteJobs: true, // No delete
        assignTasksToLabor: true,
        submitTimeMaterials: false,
        generateSendInvoices: true,
        uploadSupplierMaterialSheet: false,
        viewFinancialReports: true, // Spending only
        
        // Job Permissions
        createJob: true,
        editJobDetails: true,
        assignContractor: true,
        receiveAssignmentNotification: true,
        viewAssignedJob: true,
        modifyJobTypeBilling: true,
        
        // Invoice Permissions
        canCreateInvoices: true,
        accessToInvoices: 'Full access (no profit reports)',
        
        // Invoice Actions
        createInvoice: true,
        editInvoiceBeforeFinalizing: true,
        approveFinalizeInvoice: true,
        sendInvoiceToClient: true,
        viewAllInvoices: true,
        markInvoiceAsPaid: true,
        viewInvoicePDF: true,
      },
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01'
    },
    {
      id: '3',
      name: 'Lead Labor',
      type: 'System',
      permissions: {
        // Permission Summary
        viewAllJobs: true, // Assigned only
        createEditDeleteJobs: false,
        assignTasksToLabor: true, // Sub-Labors only
        submitTimeMaterials: false,
        generateSendInvoices: false,
        uploadSupplierMaterialSheet: false,
        viewFinancialReports: false,
        
        // Job Permissions
        createJob: false,
        editJobDetails: false,
        assignContractor: false,
        receiveAssignmentNotification: true, // App
        viewAssignedJob: true,
        modifyJobTypeBilling: true,
        
        // Invoice Permissions
        canCreateInvoices: false,
        accessToInvoices: 'View own job invoices (limited)',
        
        // Invoice Actions
        createInvoice: false,
        editInvoiceBeforeFinalizing: false,
        approveFinalizeInvoice: false,
        sendInvoiceToClient: false,
        viewAllInvoices: false,
        markInvoiceAsPaid: false,
        viewInvoicePDF: true, // if permission granted (job only)
      },
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01'
    },
    {
      id: '4',
      name: 'Labor',
      type: 'System',
      permissions: {
        // Permission Summary
        viewAllJobs: true, // Assigned only
        createEditDeleteJobs: false,
        assignTasksToLabor: false,
        submitTimeMaterials: true,
        generateSendInvoices: false,
        uploadSupplierMaterialSheet: false,
        viewFinancialReports: false,
        
        // Job Permissions
        createJob: false,
        editJobDetails: false,
        assignContractor: false,
        receiveAssignmentNotification: true, // App
        viewAssignedJob: true,
        modifyJobTypeBilling: false,
        
        // Invoice Permissions
        canCreateInvoices: false,
        accessToInvoices: 'No access',
        
        // Invoice Actions
        createInvoice: false,
        editInvoiceBeforeFinalizing: false,
        approveFinalizeInvoice: false,
        sendInvoiceToClient: false,
        viewAllInvoices: false,
        markInvoiceAsPaid: false,
        viewInvoicePDF: true, // if permission granted (job only)
      },
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01'
    },
    {
      id: '5',
      name: 'Contractor',
      type: 'System',
      permissions: {
        // Permission Summary
        viewAllJobs: true, // Email only
        createEditDeleteJobs: false,
        assignTasksToLabor: false,
        submitTimeMaterials: false,
        generateSendInvoices: true, // Receive only
        uploadSupplierMaterialSheet: false,
        viewFinancialReports: false,
        
        // Job Permissions
        createJob: false,
        editJobDetails: false,
        assignContractor: false,
        receiveAssignmentNotification: true, // Email
        viewAssignedJob: false,
        modifyJobTypeBilling: false,
        
        // Invoice Permissions
        canCreateInvoices: false,
        accessToInvoices: 'Receives invoices via email',
        
        // Invoice Actions
        createInvoice: false,
        editInvoiceBeforeFinalizing: false,
        approveFinalizeInvoice: false,
        sendInvoiceToClient: false,
        viewAllInvoices: true, // own jobs
        markInvoiceAsPaid: false,
        viewInvoicePDF: true,
      },
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01'
    },
    {
      id: '6',
      name: 'Supplier',
      type: 'System',
      permissions: {
        // Permission Summary
        viewAllJobs: false,
        createEditDeleteJobs: false,
        assignTasksToLabor: false,
        submitTimeMaterials: false,
        generateSendInvoices: false,
        uploadSupplierMaterialSheet: true, // Indirect
        viewFinancialReports: false,
        
        // Job Permissions
        createJob: false,
        editJobDetails: false,
        assignContractor: false,
        receiveAssignmentNotification: false,
        viewAssignedJob: false,
        modifyJobTypeBilling: false,
        
        // Invoice Permissions
        canCreateInvoices: false,
        accessToInvoices: 'No access',
        
        // Invoice Actions
        createInvoice: false,
        editInvoiceBeforeFinalizing: false,
        approveFinalizeInvoice: false,
        sendInvoiceToClient: false,
        viewAllInvoices: false,
        markInvoiceAsPaid: false,
        viewInvoicePDF: false,
      },
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01'
    },
    {
      id: '7',
      name: 'Customer',
      type: 'System',
      permissions: {
        // Permission Summary
        viewAllJobs: false,
        createEditDeleteJobs: false,
        assignTasksToLabor: false,
        submitTimeMaterials: false,
        generateSendInvoices: true, // Receive only
        uploadSupplierMaterialSheet: false,
        viewFinancialReports: false,
        
        // Job Permissions
        createJob: false,
        editJobDetails: false,
        assignContractor: false,
        receiveAssignmentNotification: false,
        viewAssignedJob: false,
        modifyJobTypeBilling: false,
        
        // Invoice Permissions
        canCreateInvoices: false,
        accessToInvoices: 'Receives final invoice only',
        
        // Invoice Actions
        createInvoice: false,
        editInvoiceBeforeFinalizing: false,
        approveFinalizeInvoice: false,
        sendInvoiceToClient: false,
        viewAllInvoices: false,
        markInvoiceAsPaid: false,
        viewInvoicePDF: false,
      },
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01'
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: ''
  });
  const [permissions, setPermissions] = useState<PermissionMatrix>({
    // Permission Summary
    viewAllJobs: false,
    createEditDeleteJobs: false,
    assignTasksToLabor: false,
    submitTimeMaterials: false,
    generateSendInvoices: false,
    uploadSupplierMaterialSheet: false,
    viewFinancialReports: false,
    
    // Job Permissions
    createJob: false,
    editJobDetails: false,
    assignContractor: false,
    receiveAssignmentNotification: false,
    viewAssignedJob: false,
    modifyJobTypeBilling: false,
    
    // Invoice Permissions
    canCreateInvoices: false,
    accessToInvoices: 'No access',
    
    // Invoice Actions
    createInvoice: false,
    editInvoiceBeforeFinalizing: false,
    approveFinalizeInvoice: false,
    sendInvoiceToClient: false,
    viewAllInvoices: false,
    markInvoiceAsPaid: false,
    viewInvoicePDF: false,
  });

  const handleAddRole = () => {
    setShowAddForm(true);
    setEditingRole(null);
    setFormData({ name: '', type: '' });
    setPermissions({
      // Permission Summary
      viewAllJobs: false,
      createEditDeleteJobs: false,
      assignTasksToLabor: false,
      submitTimeMaterials: false,
      generateSendInvoices: false,
      uploadSupplierMaterialSheet: false,
      viewFinancialReports: false,
      
      // Job Permissions
      createJob: false,
      editJobDetails: false,
      assignContractor: false,
      receiveAssignmentNotification: false,
      viewAssignedJob: false,
      modifyJobTypeBilling: false,
      
      // Invoice Permissions
      canCreateInvoices: false,
      accessToInvoices: 'No access',
      
      // Invoice Actions
      createInvoice: false,
      editInvoiceBeforeFinalizing: false,
      approveFinalizeInvoice: false,
      sendInvoiceToClient: false,
      viewAllInvoices: false,
      markInvoiceAsPaid: false,
      viewInvoicePDF: false,
    });
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setShowAddForm(true);
    setFormData({ name: role.name, type: role.type });
    setPermissions(role.permissions);
  };

  const handleDeleteRole = (roleId: string) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      setRoles(roles.filter(role => role.id !== roleId));
    }
  };

  const handlePermissionChange = (permissionKey: keyof PermissionMatrix, value: boolean | string) => {
    setPermissions(prev => ({
      ...prev,
      [permissionKey]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.type) {
      alert('Please fill in all required fields');
      return;
    }

    if (editingRole) {
      // Update existing role
      setRoles(roles.map(role => 
        role.id === editingRole.id 
          ? { ...role, name: formData.name, type: formData.type, permissions, updatedAt: new Date().toISOString().split('T')[0] }
          : role
      ));
    } else {
      // Add new role
      const newRole: Role = {
        id: Date.now().toString(),
        name: formData.name,
        type: formData.type,
        permissions,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      };
      setRoles([...roles, newRole]);
    }

    setShowAddForm(false);
    setEditingRole(null);
    setFormData({ name: '', type: '' });
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingRole(null);
    setFormData({ name: '', type: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
          <button
            onClick={handleAddRole}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Add Role
          </button>
        </div>

        {/* Role Listing */}
        {!showAddForm && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">All Roles</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {roles.map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{role.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{role.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{role.createdAt}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{role.updatedAt}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditRole(role)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add/Edit Role Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingRole ? 'Edit Role' : 'Create Role'}
              </h2>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Role Name *"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    required
                  >
                    <option value="">Role type*</option>
                    <option value="System">System</option>
                    <option value="Custom">Custom</option>
                    <option value="Admin">Admin</option>
                    <option value="User">User</option>
                  </select>
                </div>
              </div>

              {/* Permissions Matrix */}
              <div className="space-y-6">
                {/* Permission Summary Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 bg-purple-800 text-white p-3 rounded-t-lg">
                    Permission Summary (System-Controlled)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-300">
                      <thead>
                        <tr className="bg-purple-200">
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border border-gray-300">
                            Functionality
                          </th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border border-gray-300">
                            Permission
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 border border-gray-300">
                            View All Jobs
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-300">
                            <input
                              type="checkbox"
                              checked={permissions.viewAllJobs}
                              onChange={(e) => handlePermissionChange('viewAllJobs', e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 border border-gray-300">
                            Create/Edit/Delete Jobs
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-300">
                            <input
                              type="checkbox"
                              checked={permissions.createEditDeleteJobs}
                              onChange={(e) => handlePermissionChange('createEditDeleteJobs', e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 border border-gray-300">
                            Assign Tasks to Labor
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-300">
                            <input
                              type="checkbox"
                              checked={permissions.assignTasksToLabor}
                              onChange={(e) => handlePermissionChange('assignTasksToLabor', e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 border border-gray-300">
                            Submit Time & Materials
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-300">
                            <input
                              type="checkbox"
                              checked={permissions.submitTimeMaterials}
                              onChange={(e) => handlePermissionChange('submitTimeMaterials', e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 border border-gray-300">
                            Generate & Send Invoices
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-300">
                            <input
                              type="checkbox"
                              checked={permissions.generateSendInvoices}
                              onChange={(e) => handlePermissionChange('generateSendInvoices', e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 border border-gray-300">
                            Upload Supplier Material Sheet
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-300">
                            <input
                              type="checkbox"
                              checked={permissions.uploadSupplierMaterialSheet}
                              onChange={(e) => handlePermissionChange('uploadSupplierMaterialSheet', e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 border border-gray-300">
                            View Financial Reports
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-300">
                            <input
                              type="checkbox"
                              checked={permissions.viewFinancialReports}
                              onChange={(e) => handlePermissionChange('viewFinancialReports', e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Job Permissions Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 bg-purple-800 text-white p-3 rounded-t-lg">
                    JOB-Roles & Permissions
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-300">
                      <thead>
                        <tr className="bg-purple-200">
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border border-gray-300">
                            Action
                          </th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border border-gray-300">
                            Permission
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 border border-gray-300">
                            Create Job
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-300">
                            <input
                              type="checkbox"
                              checked={permissions.createJob}
                              onChange={(e) => handlePermissionChange('createJob', e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 border border-gray-300">
                            Edit Job Details
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-300">
                            <input
                              type="checkbox"
                              checked={permissions.editJobDetails}
                              onChange={(e) => handlePermissionChange('editJobDetails', e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 border border-gray-300">
                            Assign Contractor
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-300">
                            <input
                              type="checkbox"
                              checked={permissions.assignContractor}
                              onChange={(e) => handlePermissionChange('assignContractor', e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 border border-gray-300">
                            Receive Assignment Notification
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-300">
                            <input
                              type="checkbox"
                              checked={permissions.receiveAssignmentNotification}
                              onChange={(e) => handlePermissionChange('receiveAssignmentNotification', e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 border border-gray-300">
                            View Assigned Job
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-300">
                            <input
                              type="checkbox"
                              checked={permissions.viewAssignedJob}
                              onChange={(e) => handlePermissionChange('viewAssignedJob', e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 border border-gray-300">
                            Modify Job Type or Billing
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-300">
                            <input
                              type="checkbox"
                              checked={permissions.modifyJobTypeBilling}
                              onChange={(e) => handlePermissionChange('modifyJobTypeBilling', e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Invoice Permissions Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 bg-purple-800 text-white p-3 rounded-t-lg">
                    Invoice Permissions
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Can Create Invoices */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-3">Can Create Invoices?</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full border border-gray-300">
                          <thead>
                            <tr className="bg-purple-200">
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border border-gray-300">
                                Permission
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-center border border-gray-300">
                                <input
                                  type="checkbox"
                                  checked={permissions.canCreateInvoices}
                                  onChange={(e) => handlePermissionChange('canCreateInvoices', e.target.checked)}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Access to Invoices */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-3">Access to Invoices</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full border border-gray-300">
                          <thead>
                            <tr className="bg-purple-200">
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border border-gray-300">
                                Access Level
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="hover:bg-gray-50">
                              <td className="px-4 py-3 border border-gray-300">
                                <select
                                  value={permissions.accessToInvoices}
                                  onChange={(e) => handlePermissionChange('accessToInvoices', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                                >
                                  <option value="No access">No access</option>
                                  <option value="Full access (all invoices, markup, import/export)">Full access (all invoices, markup, import/export)</option>
                                  <option value="Full access (no profit reports)">Full access (no profit reports)</option>
                                  <option value="View own job invoices (limited)">View own job invoices (limited)</option>
                                  <option value="Receives invoices via email">Receives invoices via email</option>
                                  <option value="Receives final invoice only">Receives final invoice only</option>
                                </select>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Invoice Actions Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 bg-purple-800 text-white p-3 rounded-t-lg">
                    Invoice Actions by Role
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-300">
                      <thead>
                        <tr className="bg-purple-200">
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border border-gray-300">
                            Action
                          </th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border border-gray-300">
                            Permission
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 border border-gray-300">
                            Create Invoice
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-300">
                            <input
                              type="checkbox"
                              checked={permissions.createInvoice}
                              onChange={(e) => handlePermissionChange('createInvoice', e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 border border-gray-300">
                            Edit Invoice (Before Finalizing)
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-300">
                            <input
                              type="checkbox"
                              checked={permissions.editInvoiceBeforeFinalizing}
                              onChange={(e) => handlePermissionChange('editInvoiceBeforeFinalizing', e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 border border-gray-300">
                            Approve / Finalize Invoice
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-300">
                            <input
                              type="checkbox"
                              checked={permissions.approveFinalizeInvoice}
                              onChange={(e) => handlePermissionChange('approveFinalizeInvoice', e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 border border-gray-300">
                            Send Invoice to Client
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-300">
                            <input
                              type="checkbox"
                              checked={permissions.sendInvoiceToClient}
                              onChange={(e) => handlePermissionChange('sendInvoiceToClient', e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 border border-gray-300">
                            View All Invoices
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-300">
                            <input
                              type="checkbox"
                              checked={permissions.viewAllInvoices}
                              onChange={(e) => handlePermissionChange('viewAllInvoices', e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 border border-gray-300">
                            Mark Invoice as Paid
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-300">
                            <input
                              type="checkbox"
                              checked={permissions.markInvoiceAsPaid}
                              onChange={(e) => handlePermissionChange('markInvoiceAsPaid', e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 border border-gray-300">
                            View Invoice PDF
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-300">
                            <input
                              type="checkbox"
                              checked={permissions.viewInvoicePDF}
                              onChange={(e) => handlePermissionChange('viewInvoicePDF', e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default RolePermission;
