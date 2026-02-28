import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";

export interface LeaderboardItem {
    rank?: number;
    salesName: string;
    totalAmount: string | number;
    orderCount: number;
}

interface LeaderboardTableProps {
    data: LeaderboardItem[];
    className?: string;
}

interface LeaderboardTableRowProps {
    item: LeaderboardItem;
    index: number;
}

const LeaderboardTableRow = React.memo(function LeaderboardTableRow({ item, index }: LeaderboardTableRowProps) {
    return (
        <TableRow>
            <TableCell className="font-medium">{index + 1}</TableCell>
            <TableCell className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                    <AvatarFallback>{item.salesName ? item.salesName.substring(0, 2).toUpperCase() : '??'}</AvatarFallback>
                </Avatar>
                {item.salesName || '未知'}
            </TableCell>
            <TableCell className="text-right">{item.orderCount}</TableCell>
            <TableCell className="text-right font-bold">
                ¥{Number(item.totalAmount).toLocaleString()}
            </TableCell>
        </TableRow>
    );
});

export function LeaderboardTable({ data, className }: LeaderboardTableProps) {
    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>销售精英榜</CardTitle>
                <CardDescription>本期按成交金额排名</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">排名</TableHead>
                            <TableHead>销售员</TableHead>
                            <TableHead className="text-right">订单数</TableHead>
                            <TableHead className="text-right">成交额</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((item, index) => (
                            <LeaderboardTableRow key={index} item={item} index={index} />
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
