'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/shared/ui/button';
import { Trash2, Check, Plus, Home, Building } from 'lucide-react';
import { addCustomerAddress, deleteCustomerAddress, setDefaultAddress } from '@/features/customers/actions';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { toast } from 'sonner';
import { Card, CardContent } from '@/shared/ui/card';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';

interface AddressListProps {
    addresses: any[];
    customerId: string;
    tenantId: string;
}

export function CustomerAddressList({ addresses, customerId, tenantId }: AddressListProps) {
    const [isAddOpen, setAddOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    // New Address State
    const [newAddress, setNewAddress] = useState({
        label: '家',
        province: '',
        city: '',
        district: '',
        community: '',
        address: '',
        isDefault: false,
    });

    const handleAdd = () => {
        if (!newAddress.address) {
            toast.error('请填写详细地址');
            return;
        }
        startTransition(async () => {
            try {
                await addCustomerAddress({
                    customerId,
                    ...newAddress,
                }, tenantId);
                toast.success('地址添加成功');
                setAddOpen(false);
                setNewAddress({
                    label: '家',
                    province: '',
                    city: '',
                    district: '',
                    community: '',
                    address: '',
                    isDefault: false,
                });
            } catch (error: any) {
                toast.error(error.message || '添加失败');
            }
        });
    };

    const handleDelete = (id: string) => {
        if (!confirm('确定删除该地址吗？')) return;
        startTransition(async () => {
            await deleteCustomerAddress(id);
            toast.success('地址已删除');
        });
    };

    const handleSetDefault = (id: string) => {
        startTransition(async () => {
            await setDefaultAddress(id, customerId);
            toast.success('默认地址已更新');
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">地址管理</h3>
                <Dialog open={isAddOpen} onOpenChange={setAddOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            添加地址
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>新增地址</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">标签</Label>
                                <Input
                                    value={newAddress.label}
                                    onChange={e => setNewAddress({ ...newAddress, label: e.target.value })}
                                    className="col-span-3"
                                    placeholder="例如：家、公司"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">省/市/区</Label>
                                <div className="col-span-3 flex gap-2">
                                    <Input placeholder="省" value={newAddress.province} onChange={e => setNewAddress({ ...newAddress, province: e.target.value })} />
                                    <Input placeholder="市" value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} />
                                    <Input placeholder="区" value={newAddress.district} onChange={e => setNewAddress({ ...newAddress, district: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">小区</Label>
                                <Input
                                    value={newAddress.community}
                                    onChange={e => setNewAddress({ ...newAddress, community: e.target.value })}
                                    className="col-span-3"
                                    placeholder="小区名称"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">详细地址</Label>
                                <Input
                                    value={newAddress.address}
                                    onChange={e => setNewAddress({ ...newAddress, address: e.target.value })}
                                    className="col-span-3"
                                    placeholder="楼栋号、门牌号"
                                />
                            </div>
                            <Button onClick={handleAdd} disabled={isPending} className="w-full">
                                {isPending ? '保存中...' : '保存地址'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-3">
                {addresses.length === 0 ? (
                    <div className="text-center text-gray-500 py-4 border border-dashed rounded-lg">暂无地址</div>
                ) : (
                    addresses.map((addr) => (
                        <Card key={addr.id} className={cn("relative group", addr.isDefault && "border-blue-200 bg-blue-50")}>
                            <CardContent className="p-4 flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="flex items-center gap-1">
                                            {addr.label === '公司' ? <Building className="h-3 w-3" /> : <Home className="h-3 w-3" />}
                                            {addr.label}
                                        </Badge>
                                        {addr.isDefault && <Badge variant="secondary" className="bg-blue-100 text-blue-700">默认</Badge>}
                                        <span className="text-sm text-gray-500">{addr.province} {addr.city} {addr.district}</span>
                                    </div>
                                    <div className="font-medium text-gray-900">
                                        {addr.community} {addr.address}
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {!addr.isDefault && (
                                        <Button variant="ghost" size="icon" onClick={() => handleSetDefault(addr.id)} title="设为默认">
                                            <Check className="h-4 w-4 text-green-600" />
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(addr.id)} title="删除">
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
