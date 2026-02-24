'use client';

import { useState } from 'react';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { Switch } from '@/shared/ui/switch';
// import { Button } from '@/shared/ui/button';

interface AdditionalFee {
    type: 'HIGH_ALTITUDE' | 'LONG_DISTANCE' | 'SPECIAL_WALL' | 'OTHER';
    amount: number;
    description?: string;
    quantity?: number;
}

export interface FeeBreakdown {
    baseFee: number;
    additionalFees?: AdditionalFee[];
}

interface FeeBreakdownFormProps {
    value?: FeeBreakdown;
    onChange: (breakdown: FeeBreakdown) => void;
}

/**
 * 工费明细表单组件
 * 用于在创建或修改任务时，计算基础工费及各种加项费用（高空、路费、打孔等）
 * 
 * @param {FeeBreakdown} value - 费用的初始值或受控值
 * @param {(breakdown: FeeBreakdown) => void} onChange - 费用变动时的回调
 */
export function FeeBreakdownForm({ value, onChange }: FeeBreakdownFormProps) {
    const [baseFee, setBaseFee] = useState(value?.baseFee || 0);
    const [enableHighAltitude, setEnableHighAltitude] = useState(false);
    const [highAltitudeFee, setHighAltitudeFee] = useState(50);
    const [enableLongDistance, setEnableLongDistance] = useState(false);
    const [distanceFee, setDistanceFee] = useState(0);
    const [distanceKm, setDistanceKm] = useState(0);
    const [enableSpecialWall, setEnableSpecialWall] = useState(false);
    const [specialWallFee, setSpecialWallFee] = useState(0);
    const [specialWallCount, setSpecialWallCount] = useState(0);

    const calculateTotal = () => {
        let total = baseFee;
        if (enableHighAltitude) total += highAltitudeFee;
        if (enableLongDistance) total += distanceFee * distanceKm;
        if (enableSpecialWall) total += specialWallFee * specialWallCount;
        return total;
    };

    const handleUpdate = () => {
        const additionalFees: AdditionalFee[] = [];
        if (enableHighAltitude) {
            additionalFees.push({
                type: 'HIGH_ALTITUDE',
                amount: highAltitudeFee,
                description: '高空作业费',
                quantity: 1
            });
        }
        if (enableLongDistance) {
            additionalFees.push({
                type: 'LONG_DISTANCE',
                amount: distanceFee * distanceKm,
                description: `超远路费 (${distanceKm}公里)`,
                quantity: distanceKm
            });
        }
        if (enableSpecialWall) {
            additionalFees.push({
                type: 'SPECIAL_WALL',
                amount: specialWallFee * specialWallCount,
                description: `特种墙体打孔费 (${specialWallCount}个)`,
                quantity: specialWallCount
            });
        }

        onChange({
            baseFee,
            additionalFees: additionalFees.length > 0 ? additionalFees : undefined
        });
    };

    return (
        <div className="space-y-4 border p-4 rounded-md bg-muted/20">
            <div className="space-y-2">
                <Label htmlFor="baseFee">基础工费 (元)</Label>
                <Input
                    id="baseFee"
                    type="number"
                    value={baseFee}
                    onChange={(e) => {
                        setBaseFee(Number(e.target.value));
                        handleUpdate();
                    }}
                />
            </div>

            <div className="space-y-3 border-t pt-3">
                <h4 className="font-medium text-sm">加项费用</h4>

                {/* 高空作业费 */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="highAltitude"
                            checked={enableHighAltitude}
                            onCheckedChange={(c) => {
                                setEnableHighAltitude(c);
                                setTimeout(handleUpdate, 0);
                            }}
                        />
                        <Label htmlFor="highAltitude">高空作业费</Label>
                    </div>
                    {enableHighAltitude && (
                        <Input
                            type="number"
                            className="w-24"
                            value={highAltitudeFee}
                            onChange={(e) => {
                                setHighAltitudeFee(Number(e.target.value));
                                handleUpdate();
                            }}
                        />
                    )}
                </div>

                {/* 超远路费 */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="longDistance"
                            checked={enableLongDistance}
                            onCheckedChange={(c) => {
                                setEnableLongDistance(c);
                                setTimeout(handleUpdate, 0);
                            }}
                        />
                        <Label htmlFor="longDistance">超远路费</Label>
                    </div>
                    {enableLongDistance && (
                        <div className="flex items-center space-x-2">
                            <Input
                                type="number"
                                placeholder="公里"
                                className="w-20"
                                value={distanceKm}
                                onChange={(e) => {
                                    setDistanceKm(Number(e.target.value));
                                    handleUpdate();
                                }}
                            />
                            <span className="text-sm">×</span>
                            <Input
                                type="number"
                                placeholder="单价"
                                className="w-20"
                                value={distanceFee}
                                onChange={(e) => {
                                    setDistanceFee(Number(e.target.value));
                                    handleUpdate();
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* 特种墙体打孔费 */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="specialWall"
                            checked={enableSpecialWall}
                            onCheckedChange={(c) => {
                                setEnableSpecialWall(c);
                                setTimeout(handleUpdate, 0);
                            }}
                        />
                        <Label htmlFor="specialWall">特种墙体打孔</Label>
                    </div>
                    {enableSpecialWall && (
                        <div className="flex items-center space-x-2">
                            <Input
                                type="number"
                                placeholder="数量"
                                className="w-20"
                                value={specialWallCount}
                                onChange={(e) => {
                                    setSpecialWallCount(Number(e.target.value));
                                    handleUpdate();
                                }}
                            />
                            <span className="text-sm">×</span>
                            <Input
                                type="number"
                                placeholder="单价"
                                className="w-20"
                                value={specialWallFee}
                                onChange={(e) => {
                                    setSpecialWallFee(Number(e.target.value));
                                    handleUpdate();
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="border-t pt-3 flex justify-between items-center font-semibold">
                <span>预估总工费:</span>
                <span className="text-lg text-primary">¥{calculateTotal().toFixed(2)}</span>
            </div>
        </div>
    );
}
