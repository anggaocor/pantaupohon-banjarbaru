'use client'

import { ReactNode, useState } from 'react'
import Card from './Card'

interface CardListProps {
  children: ReactNode
  className?: string
  pageSize?: number
  siblingCount?: number
  showPagination?: boolean
}

export default function CardList({
  children,
  className = '',
  pageSize = 10,
  siblingCount = 1,
  showPagination = true,
}: CardListProps) {
  const [page, setPage] = useState(1)

  const items = Array.isArray(children) ? children : [children]
  const total = items.length
  const totalPages = Math.ceil(total / pageSize)

  const startIndex = (page - 1) * pageSize
  const currentItems = items.slice(startIndex, startIndex + pageSize)

  // Generate pagination dengan ellipsis
  const generatePages = () => {
    const pages: (number | string)[] = []

    const left = Math.max(2, page - siblingCount)
    const right = Math.min(totalPages - 1, page + siblingCount)

    pages.push(1)

    if (left > 2) pages.push('…')

    for (let i = left; i <= right; i++) {
      pages.push(i)
    }

    if (right < totalPages - 1) pages.push('…')

    if (totalPages > 1) pages.push(totalPages)

    return pages
  }

  const pageList = generatePages()

  return (
    <div className="w-full space-y-4">
      <div className="overflow-x-auto">
        <div
          className={`
            flex flex-wrap gap-4
            md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
            ${className}
          `}
        >
          {currentItems.map((item, index) => (
            <div key={index} className="w-full">
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination - hanya tampil jika ada lebih dari 1 halaman */}
      {showPagination && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 flex-wrap mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          {pageList.map((p, i) =>
            p === '…' ? (
              <span key={i} className="px-2 text-gray-500">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(Number(p))}
                className={`
                  px-4 py-2 border rounded-lg text-sm font-medium
                  ${p === page 
                    ? 'bg-primary-600 text-white border-primary-600' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>

          {/* Info halaman */}
          <div className="text-sm text-gray-500 ml-4">
            Halaman {page} dari {totalPages}
          </div>
        </div>
      )}
    </div>
  )
}