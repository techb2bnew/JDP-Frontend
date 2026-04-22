import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import Autocomplete from 'react-google-autocomplete'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'

export interface SupplierFormData {
  fullName: string
  role: string
  companyName: string
  contactPerson: string
  email: string
  phone: string
  address: string
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  contractStart: string
  contractEnd: string
  totalOrders: number
  notes: string
}

interface SupplierFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  submitLabel: string
  formData: SupplierFormData
  setFormData: React.Dispatch<React.SetStateAction<SupplierFormData>>
  validationErrors: Record<string, string>
  setValidationErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  roles: any[]
  onSubmit: () => void
  onCancel: () => void
  isLoading?: boolean
}

export function SupplierFormDialog({
  open,
  onOpenChange,
  title,
  submitLabel,
  formData,
  setFormData,
  validationErrors,
  setValidationErrors,
  roles,
  onSubmit,
  onCancel,
  isLoading = false
}: SupplierFormDialogProps) {
    console.log(formData,"formData");

  const resolveAutocompleteAddress = (place: any): string => {
    const formattedAddress = String(place?.formatted_address || '').trim()
    if (formattedAddress) return formattedAddress

    const placeName = String(place?.name || '').trim()
    const vicinity = String(place?.vicinity || '').trim()
    if (placeName && vicinity) return `${placeName}, ${vicinity}`
    if (placeName) return placeName
    if (vicinity) return vicinity

    const components = Array.isArray(place?.address_components)
      ? place.address_components
      : []
    const fromComponents = components
      .map((component: any) => component?.long_name)
      .filter((part: unknown): part is string => typeof part === 'string' && part.trim().length > 0)
      .join(', ')

    return fromComponents.trim()
  }

  const isPacInteraction = (target: EventTarget | null): boolean => {
    const element = target as HTMLElement | null
    if (element?.closest?.('.pac-container')) return true
    if (element?.classList?.contains('pac-item')) return true
    if (element?.classList?.contains('pac-item-query')) return true
    return false
  }
    
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh]"
        onInteractOutside={(e) => {
          if (isPacInteraction(e.target)) e.preventDefault()
        }}
        onPointerDownOutside={(e) => {
          if (isPacInteraction(e.target)) e.preventDefault()
        }}
        onFocusOutside={(e) => {
          if (isPacInteraction(e.target)) e.preventDefault()
        }}
      >
        <style jsx global>{`
          .pac-container {
            z-index: 999999 !important;
            pointer-events: auto !important;
          }
          .pac-item {
            cursor: pointer !important;
            pointer-events: auto !important;
          }
          body:has(.pac-container:not([style*='display: none'])) [data-radix-dialog-overlay] {
            pointer-events: none !important;
          }
        `}</style>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-gray-600">Loading supplier details...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 py-4 max-h-[65vh] overflow-y-auto p-2">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                {/* <Select
                  value={formData.role}
                  onValueChange={(value: any) => {
                    setFormData({ ...formData, role: value })
                    if (validationErrors.role) {
                      setValidationErrors({ ...validationErrors, role: '' })
                    }
                  }}
                >
                  <SelectTrigger className={validationErrors.role ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.roleName}>
                        {role.roleName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.role && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.role}</p>
                )} */}
                 <Input
                  id="Role"
                  value={formData.role}
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => {
                    setFormData({ ...formData, fullName: e.target.value })
                    if (validationErrors.fullName) {
                      setValidationErrors({ ...validationErrors, fullName: '' })
                    }
                  }}
                  placeholder="Enter full name"
                  className={validationErrors.fullName ? 'border-red-500' : ''}
                />
                {validationErrors.fullName && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.fullName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e: { target: { value: any } }) => {
                    setFormData({ ...formData, companyName: e.target.value })
                    if (validationErrors.companyName) {
                      setValidationErrors({ ...validationErrors, companyName: '' })
                    }
                  }}
                  placeholder="Enter company name"
                  className={validationErrors.companyName ? 'border-red-500' : ''}
                />
                {validationErrors.companyName && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.companyName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person *</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => {
                    setFormData({ ...formData, contactPerson: e.target.value })
                    if (validationErrors.contactPerson) {
                      setValidationErrors({ ...validationErrors, contactPerson: '' })
                    }
                  }}
                  placeholder="Enter contact person name"
                  className={validationErrors.contactPerson ? 'border-red-500' : ''}
                />
                {validationErrors.contactPerson && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.contactPerson}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value })
                    if (validationErrors.email) {
                      setValidationErrors({ ...validationErrors, email: '' })
                    }
                  }}
                  placeholder="Enter email address"
                  className={validationErrors.email ? 'border-red-500' : ''}
                />
                {validationErrors.email && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <PhoneInput
                  id="phone"
                  international
                  withCountryCallingCode
                  defaultCountry="US"
                  countryCallingCodeEditable={false}
                  limitMaxLength
                  value={formData.phone}
                  onChange={(value) => {
                    const safeValue = value || ''
                    setFormData({ ...formData, phone: safeValue })
                    if (validationErrors.phone) {
                      setValidationErrors({ ...validationErrors, phone: '' })
                    }
                  }}
                  placeholder="Enter phone number"
                  className={
                    validationErrors.phone
                      ? 'border border-red-500 rounded-md px-2 py-2'
                      : 'border border-gray-300 rounded-md px-2 py-2'
                  }
                />
                {validationErrors.phone && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'inactive' | 'pending' | 'suspended') =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="address">Address</Label>
                <Autocomplete
                  apiKey={
                    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
                    'AIzaSyBEQp-ZFMYZjsTNyximu2pAifQ9EWA4W3M'
                  }
                  onPlaceSelected={(place: any) => {
                    const address = resolveAutocompleteAddress(place)
                    if (address) {
                      setFormData((prev) => ({ ...prev, address }))
                      if (validationErrors.address) {
                        setValidationErrors({ ...validationErrors, address: '' })
                      }
                    }
                  }}
                  options={{
                    types: ['address']
                  }}
                  value={formData.address}
                  onChange={(e: any) => {
                    const value = e.target.value
                    setFormData((prev) => ({ ...prev, address: value }))
                    if (validationErrors.address) {
                      setValidationErrors({ ...validationErrors, address: '' })
                    }
                  }}
                  placeholder="Enter full address"
                  className={`w-full h-10 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                    validationErrors.address ? 'border-red-500' : ''
                  }`}
                />
                {validationErrors.address && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.address}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contractStart">Contract Start</Label>
                <Input
                  id="contractStart"
                  type="date"
                  value={formData.contractStart}
                  max={formData.contractEnd || undefined}
                  onChange={(e) => setFormData({ ...formData, contractStart: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contractEnd">Contract End</Label>
                <Input
                  id="contractEnd"
                  type="date"
                  value={formData.contractEnd}
                  min={formData.contractStart || undefined}
                  onChange={(e: { target: { value: any } }) => setFormData({ ...formData, contractEnd: e.target.value })}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e: { target: { value: any } }) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={onSubmit} className="bg-primary text-white hover:bg-[#0090e6]">
                {submitLabel}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}