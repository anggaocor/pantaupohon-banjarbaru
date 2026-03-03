'use client'

import { useSearchParams } from 'next/navigation'

export default function SurveyContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  return <div>{id}</div>
}