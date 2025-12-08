'use client'

import { Search } from 'lucide-react'
import React, { useState } from 'react'

import { PackageDefinition, AVAILABLE_PACKAGES } from '@/shared/types/order'

interface CurtainPackageSelectorProps {
    selectedPackage?: PackageDefinition
    onPackageChange: (packageId: string) => void
}

export const CurtainPackageSelector: React.FC<CurtainPackageSelectorProps> = ({
    selectedPackage,
    onPackageChange
}) => {
    const [searchTerm, setSearchTerm] = useState('')
    const [showSuggestions, setShowSuggestions] = useState(false)

    // 过滤套餐列表
    const filteredPackages = AVAILABLE_PACKAGES.filter(pkg =>
        pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // 处理套餐选择
    const handleSelectPackage = (pkg: PackageDefinition) => {
        setSearchTerm(pkg.name)
        setShowSuggestions(false)
        onPackageChange(pkg.id)
    }

    // 清除套餐选择
    const handleClear = () => {
        setSearchTerm('')
        onPackageChange('')
    }

    return (
        <div className="bg-white rounded-lg border border-paper-300 p-6 shadow-sm">
            <div className="grid grid-cols-12 gap-6">
                {/* 左侧：套餐搜索 (3/12) */}
                <div className="col-span-3 space-y-2">
                    <label className="block text-sm font-medium text-ink-700">
                        套餐选择
                    </label>
                    <div className="relative">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    setShowSuggestions(true)
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                className="paper-input w-full pl-10 pr-20 h-10"
                                placeholder="搜索套餐..."
                            />
                            {searchTerm && (
                                <button
                                    onClick={handleClear}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-400 hover:text-ink-600"
                                >
                                    清除
                                </button>
                            )}
                        </div>

                        {/* 搜索建议下拉列表 */}
                        {showSuggestions && filteredPackages.length > 0 && (
                            <div className="absolute z-10 w-full bg-white border border-paper-300 rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                                {filteredPackages.map(pkg => (
                                    <div
                                        key={pkg.id}
                                        className="px-4 py-3 hover:bg-paper-100 cursor-pointer border-b border-paper-200 last:border-b-0"
                                        onMouseDown={() => handleSelectPackage(pkg)}
                                    >
                                        <div className="font-medium text-ink-800">{pkg.name}</div>
                                        <div className="text-xs text-ink-500 mt-1">
                                            ¥{pkg.price.toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 右侧：套餐内容展示 (9/12) */}
                <div className="col-span-9 space-y-2">
                    <label className="block text-sm font-medium text-ink-700">
                        套餐内容
                    </label>
                    <div className="bg-paper-50 rounded-md p-4 border border-paper-200">
                        {selectedPackage ? (
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-baseline gap-3">
                                        <span className="font-bold text-lg text-ink-900">
                                            {selectedPackage.name}
                                        </span>
                                        <span className="text-sm text-ink-500">
                                            {selectedPackage.description}
                                        </span>
                                    </div>
                                    <div className="flex gap-6 text-sm text-ink-600">
                                        {selectedPackage.items.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-1">
                                                <span className="font-medium">
                                                    {item.type === 'cloth' ? '布料' : item.type === 'gauze' ? '纱料' : '轨道'}
                                                </span>
                                                <span>{item.quota}米</span>
                                                <span className="text-ink-400 text-xs">
                                                    (基准¥{item.basePrice})
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="text-primary-600 font-bold text-xl">
                                    ¥{selectedPackage.price.toFixed(2)}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center py-2 text-ink-400 text-sm">
                                请选择套餐
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
