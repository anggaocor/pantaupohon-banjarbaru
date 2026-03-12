import { Suspense } from 'react'
import UploadContent from './UploadContent'
import UploadLoading from './loading'

// Force dynamic rendering untuk menghindari prerendering error
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export default function UploadPage() {
  return (
    <Suspense fallback={<UploadLoading />}>
      <UploadContent />
    </Suspense>
  )
}