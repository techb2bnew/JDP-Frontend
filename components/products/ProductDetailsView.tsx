import { Label } from '../ui/label'

type Props = {
  product: any
}

const formatCurrency = (value?: number) => {
  const amount = Number(value ?? 0)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)
}

const getViewCategoryLabel = (product: any): string => {
  const categoryValue =
    product?.category ??
    product?.category_name ??
    product?.categories?.name ??
    product?.categories?.category_name

  if (typeof categoryValue === 'string' && categoryValue.trim()) {
    return categoryValue.trim()
  }

  return 'Not available'
}

export function ProductDetailsView({ product }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Product Name</Label>
          <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
            {product?.product_name || 'Not available'}
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Category</Label>
          <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
            {getViewCategoryLabel(product)}
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Supplier SKU</Label>
          <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900 font-mono">
            {product?.supplier_sku || 'Not available'}
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">JDP SKU</Label>
          <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900 font-mono">
            {product?.jdp_sku || 'Not available'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">JDP Price</Label>
          <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
            {formatCurrency(product?.jdp_price || 0)}
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Markup Percentage</Label>
          <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
            {product?.markup_percentage != null ? `${product.markup_percentage}%` : 'Not available'}
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Markup Amount</Label>
          <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
            {formatCurrency(product?.markup_amount || 0)}
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Stock Quantity</Label>
          <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
            {product?.stock_quantity != null ? product.stock_quantity : 'Not available'}
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Unit</Label>
          <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900 capitalize">
            {product?.unit || 'Not available'}
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Unit Cost</Label>
          <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900 capitalize">
            {product?.unit_cost != null && product.unit_cost !== '' ? product.unit_cost : 'Not available'}
          </div>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2 block">Description</Label>
        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900 min-h-[60px]">
          {product?.description || 'No description provided'}
        </div>
      </div>

      {product?.suppliers && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Supplier Information</h4>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Company Name</Label>
              <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
                {product.suppliers.company_name || 'Not available'}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Contact Person</Label>
              <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
                {product.suppliers.contact_person || 'Not available'}
              </div>
            </div>
            {product.suppliers.users && (
              <>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Email</Label>
                  <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
                    {product.suppliers.users.email || 'Not available'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Phone</Label>
                  <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
                    {product.suppliers.users.phone || 'Not available'}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Created At</Label>
          <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
            {product?.created_at ? new Date(product.created_at).toLocaleDateString() : 'Not available'}
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Last Updated</Label>
          <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
            {product?.updated_at ? new Date(product.updated_at).toLocaleDateString() : 'Not available'}
          </div>
        </div>
      </div>
    </div>
  )
}

